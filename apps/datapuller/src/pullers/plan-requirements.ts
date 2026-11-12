import { Types } from "mongoose";

import { UCSB_PLAN_REQUIREMENTS } from "@repo/BtLL/ucsb";
import { PlanModel, PlanRequirementModel } from "@repo/common/models";

import { Config } from "../shared/config";

const SYSTEM = "system";

/**
 * Load GradTrak's official UCSB requirement sets (packages/BtLL/ucsb) into
 * the planrequirements collection, keyed by name, and remove official sets
 * that are no longer listed. Then bring every saved plan's requirement list
 * in line with its colleges, majors and minors, keeping each plan's manual
 * check-offs for the sets it already had.
 */
const loadPlanRequirements = async (config: Config) => {
  const { log } = config;
  const names = UCSB_PLAN_REQUIREMENTS.map((seed) => seed.name);

  for (const seed of UCSB_PLAN_REQUIREMENTS) {
    await PlanRequirementModel.updateOne(
      { name: seed.name, createdBy: SYSTEM },
      {
        $set: {
          code: seed.code,
          isUcReq: seed.isUcReq,
          college: seed.college,
          major: seed.major,
          minor: seed.minor,
          catalogYear: seed.catalogYear,
          isOfficial: true,
        },
      },
      { upsert: true }
    );
  }

  const removed = await PlanRequirementModel.deleteMany({
    createdBy: SYSTEM,
    name: { $nin: names },
  });

  log.info(
    `Loaded ${names.length} requirement sets; removed ${removed.deletedCount} old ones.`
  );

  const requirements = await PlanRequirementModel.find()
    .select({ _id: 1, isUcReq: 1, college: 1, major: 1, minor: 1 })
    .lean();

  const plans = await PlanModel.find();
  let updated = 0;

  for (const plan of plans) {
    const wanted = requirements.filter(
      (requirement) =>
        requirement.isUcReq ||
        (requirement.college && plan.colleges.includes(requirement.college)) ||
        (requirement.major && plan.majors.includes(requirement.major)) ||
        (requirement.minor && plan.minors.includes(requirement.minor))
    );
    const wantedIds = new Set(wanted.map((r) => r._id.toString()));
    const currentIds = plan.selectedPlanRequirements.map((s) =>
      s.planRequirementId.toString()
    );

    const kept = plan.selectedPlanRequirements.filter((s) =>
      wantedIds.has(s.planRequirementId.toString())
    );
    const added = wanted
      .filter((r) => !currentIds.includes(r._id.toString()))
      .map((r) => ({
        planRequirementId: new Types.ObjectId(r._id.toString()),
        manualOverrides: [],
      }));

    if (added.length === 0 && kept.length === currentIds.length) continue;

    plan.set("selectedPlanRequirements", [...kept, ...added]);
    await plan.save();
    updated++;
  }

  log.info(`Updated requirement lists on ${updated} of ${plans.length} plans.`);
};

export default { loadPlanRequirements };
