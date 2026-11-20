import { DragEvent, Fragment, useMemo, useRef, useState } from "react";

import classNames from "classnames";
import { Plus } from "iconoir-react";

import { Button } from "@repo/theme";

import Units from "@/components/Units";
import useSchedule from "@/hooks/useSchedule";
import { IScheduleClass, IScheduleEvent } from "@/lib/api";
import { Color, Component } from "@/lib/generated/graphql";

import { getUnits } from "../../schedule";
import EventDialog from "../EventDialog";
import Catalog from "./Catalog";
import Class from "./Class";
import Event from "./Event";
import styles from "./SideBar.module.scss";

const CLASS_DRAG_TYPE = "application/x-sbtime-schedule-class";

interface SideBarProps {
  expanded: boolean[];
  onSortEnd: (previousIndex: number, currentIndex: number) => void;
  onClassSelect: (
    subject: string,
    courseNumber: string,
    number: string,
    sessionId: string
  ) => void;
  onSectionSelect: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    number: string
  ) => void;
  onSectionMouseOver: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    number: string
  ) => void;
  onSectionMouseOut: () => void;
  onExpandedChange: (index: number, expanded: boolean) => void;
  onDeleteClass: (cls: IScheduleClass["class"]) => void;
  onDeleteEvent: (event: IScheduleEvent) => void;
  onColorChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    color: Color
  ) => void;
  onLockChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    locked: boolean
  ) => void;
  onHideChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    hidden: boolean
  ) => void;
  onSectionBlockToggle: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    sectionId: number,
    blocked: boolean
  ) => void;
  onComponentBlockToggle: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    component: Component,
    blocked: boolean
  ) => void;
  onComponentLockChange: (
    subject: string,
    courseNumber: string,
    classNumber: string,
    component: Component,
    locked: boolean
  ) => void;
  onEventColorChange: (id: string, color: Color) => void;
  onEventTitleChange: (id: string, title: string) => void;
  onEventHideChange: (id: string, hidden: boolean) => void;
}

export default function SideBar({
  onClassSelect,
  expanded,
  onSectionSelect,
  onSectionMouseOver,
  onSectionMouseOut,
  onExpandedChange,
  onSortEnd,
  onDeleteClass,
  onDeleteEvent,
  onColorChange,
  onLockChange,
  onHideChange,
  onSectionBlockToggle,
  onComponentBlockToggle,
  onComponentLockChange,
  onEventColorChange,
  onEventTitleChange,
  onEventHideChange,
}: SideBarProps) {
  const { schedule, editing } = useSchedule();

  const bodyRef = useRef<HTMLDivElement>(null);

  const [minimum, maximum] = useMemo(() => getUnits(schedule), [schedule]);

  // Drag a class up or down to reorder the list, the same way GradPath
  // reorders classes within a quarter. Only the order changes.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);

  // Where the dragged class would land: before the first class whose middle
  // is below the cursor, or at the end
  const findInsertPosition = (clientY: number) => {
    const classElements =
      bodyRef.current?.querySelectorAll("[data-class-container]") ?? [];

    for (let i = 0; i < classElements.length; i++) {
      const rect = classElements[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }

    return classElements.length;
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    // Ignore drags that start inside the card, such as selected text or the
    // class drawer, which React bubbles up through its portal
    if (e.target !== e.currentTarget) return;

    e.dataTransfer.setData(CLASS_DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";

    setPlaceholderHeight(e.currentTarget.getBoundingClientRect().height);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setPlaceholderIndex(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (draggingIndex === null) return;

    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    setPlaceholderIndex(findInsertPosition(e.clientY));
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Ignore leaves bubbled up from the cards inside
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setPlaceholderIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (draggingIndex === null) return;
    e.preventDefault();

    const insertPos = findInsertPosition(e.clientY);
    const newIndex = draggingIndex < insertPos ? insertPos - 1 : insertPos;

    if (newIndex !== draggingIndex) onSortEnd(draggingIndex, newIndex);

    handleDragEnd();
  };

  // A gap where the class would land, except right next to where it started
  const showPlaceholderAt = (index: number) =>
    draggingIndex !== null &&
    placeholderIndex === index &&
    index !== draggingIndex &&
    index !== draggingIndex + 1;

  const placeholder = (
    <div
      className={styles.placeholder}
      style={{ height: placeholderHeight }}
      aria-hidden
    />
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.context}>
          <div className={styles.data}>
            {schedule.semester} {schedule.year}
          </div>
          <div className={styles.data}>
            {schedule.classes.length === 1
              ? "1 class"
              : `${schedule.classes.length} classes`}
            ,{" "}
            <Units unitsMin={minimum} unitsMax={maximum}>
              {(units) => units}
            </Units>
          </div>
        </div>
        {editing && (
          <Catalog
            onClassSelect={onClassSelect}
            semester={schedule.semester}
            year={schedule.year}
          >
            <Button className={styles.button}>
              Add class
              <Plus />
            </Button>
          </Catalog>
        )}
        {editing && (
          <EventDialog>
            <Button className={styles.button}>
              Add event
              <Plus />
            </Button>
          </EventDialog>
        )}
      </div>
      <div
        className={styles.body}
        ref={bodyRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {schedule.events?.map((event, index) => {
          return (
            <Event
              key={index}
              event={event}
              onDelete={onDeleteEvent}
              onColorSelect={(c) => {
                onEventColorChange(event._id, c);
              }}
              onEventTitleChange={onEventTitleChange}
              onHideChange={(hidden) => {
                onEventHideChange(event._id, hidden);
              }}
            />
          );
        })}
        {schedule.classes.map((selectedClass, index) => {
          return (
            <Fragment
              key={`${selectedClass.class.subject}${selectedClass.class.courseNumber}${selectedClass.class.number}`}
            >
              {showPlaceholderAt(index) && placeholder}
              <div
                data-class-container
                className={classNames(styles.draggable, {
                  [styles.dragging]: draggingIndex === index,
                })}
                draggable={editing}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
              >
                <Class
                  class={selectedClass.class}
                  selectedSections={selectedClass.selectedSections}
                  semester={schedule.semester}
                  year={schedule.year}
                  sessionId={schedule.sessionId}
                  color={selectedClass.color!}
                  hidden={selectedClass.hidden ?? false}
                  locked={selectedClass.locked ?? false}
                  blockedSections={selectedClass.blockedSections}
                  lockedComponents={selectedClass.lockedComponents ?? []}
                  expanded={expanded[index] ?? false}
                  onExpandedChange={(expanded) =>
                    onExpandedChange(index, expanded)
                  }
                  editing={editing}
                  onSectionSelect={onSectionSelect}
                  onSectionMouseOver={onSectionMouseOver}
                  onSectionMouseOut={onSectionMouseOut}
                  onDelete={onDeleteClass}
                  onColorChange={onColorChange}
                  onLockChange={onLockChange}
                  onHideChange={onHideChange}
                  onSectionBlockToggle={onSectionBlockToggle}
                  onComponentBlockToggle={onComponentBlockToggle}
                  onComponentLockChange={onComponentLockChange}
                />
              </div>
            </Fragment>
          );
        })}
        {showPlaceholderAt(schedule.classes.length) && placeholder}
      </div>
    </div>
  );
}
