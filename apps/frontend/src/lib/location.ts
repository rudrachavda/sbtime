// UCSB buildings used in class locations ("HSSB 1173" -> HSSB).
// Coordinates are building centers from OpenStreetMap (© OpenStreetMap
// contributors, ODbL: https://www.openstreetmap.org/copyright), matched to
// UCSB's room codes by hand. Codes without a confident match have no
// coordinates and show as text only.

export interface Building {
  location?: [number, number];
  name: string;
  link?: string;
}

const mapsLink = ([lng, lat]: [number, number]) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const pinned = (name: string, location: [number, number]): Building => ({
  name,
  location,
  link: mapsLink(location),
});

export const buildings: Record<string, Building> = {
  ARTS: pinned("Arts Building", [-119.849311, 34.412571]),
  BIOEN: pinned("Bioengineering Building", [-119.844727, 34.413122]),
  BIOL2: pinned("Biology II", [-119.842647, 34.411971]),
  BREN: pinned("Bren Hall", [-119.841983, 34.41319]),
  BRDA: pinned("Broida Hall", [-119.843071, 34.414148]),
  BUCHN: pinned("Buchanan Hall", [-119.844593, 34.415447]),
  CAMPB: pinned("Campbell Hall", [-119.845268, 34.416274]),
  CHEM: pinned("Chemistry Building", [-119.842633, 34.415449]),
  CRST: pinned("College of Creative Studies", [-119.845818, 34.411082]),
  ED: pinned("Education Building", [-119.850425, 34.415051]),
  ELLSN: pinned("Ellison Hall", [-119.845318, 34.415569]),
  ELNGS: pinned("Elings Hall", [-119.84004, 34.415306]),
  EMBAR: pinned("Embarcadero Hall", [-119.855777, 34.412115]),
  ENGR2: pinned("Engineering II", [-119.841392, 34.414812]),
  ESB: pinned("Engineering Science Building", [-119.841568, 34.415627]),
  GIRV: pinned("Girvetz Hall", [-119.846938, 34.413625]),
  HFH: pinned("Harold Frank Hall", [-119.841447, 34.413835]),
  HNLY: pinned("Henley Hall", [-119.844588, 34.417111]),
  HSSB: pinned(
    "Humanities and Social Sciences Building",
    [-119.850494, 34.413654]
  ),
  ICA: pinned("Intercollegiate Athletics", [-119.850458, 34.416005]),
  ILP: pinned("Interactive Learning Pavilion", [-119.84532, 34.412523]),
  IV: pinned("Isla Vista Theater", [-119.855022, 34.411338]),
  KERR: pinned("Kerr Hall", [-119.846845, 34.41455]),
  LIB: pinned("Library", [-119.845459, 34.413767]),
  LSB: pinned("Life Sciences Building", [-119.843609, 34.411935]),
  MUSIC: pinned("Music Building", [-119.847135, 34.412345]),
  NH: pinned("North Hall", [-119.846692, 34.415132]),
  NOBLE: pinned("Noble Hall", [-119.843643, 34.412668]),
  OLDGM: pinned("Old Gym", [-119.848155, 34.414546]),
  PHELP: pinned("Phelps Hall", [-119.844296, 34.416157]),
  PLLOK: pinned("Pollock Theater", [-119.848861, 34.415064]),
  "PSB-N": pinned("Physical Sciences Building North", [-119.843678, 34.415452]),
  "PSB-S": pinned("Physical Sciences Building South", [-119.842613, 34.414502]),
  PSYCH: pinned("Psychology Building", [-119.845066, 34.41208]),
  "PSY-E": pinned("Psychology East", [-119.844613, 34.411986]),
  RECEN: pinned("Recreation Center", [-119.849518, 34.419089]),
  RGYM: pinned("Robertson Gymnasium", [-119.849258, 34.416194]),
  SH: pinned("South Hall", [-119.847032, 34.413896]),
  SRB: pinned("Student Resource Building", [-119.852583, 34.412641]),
  SSMS: pinned("Social Sciences and Media Studies", [-119.849453, 34.415048]),
  "TD-E": pinned("Theater and Dance East", [-119.850612, 34.412599]),
  "TD-W": pinned("Theater and Dance West", [-119.851466, 34.412494]),
  WEBB: pinned("Webb Hall", [-119.843701, 34.413387]),
  "387": pinned("Building 387", [-119.845674, 34.411971]),
  "451": pinned("Military Science (Building 451)", [-119.843659, 34.416823]),
  "599": pinned("Building 599", [-119.849255, 34.413411]),
  // Building 569; OpenStreetMap still calls it "Pharmacology".
  BSIF: pinned(
    "Biological Sciences Instructional Facility",
    [-119.843676, 34.412906]
  ),
  // Harder Stadium Offices (Building 579); pinned at the stadium.
  HARDR: pinned("Harder Stadium", [-119.854488, 34.420444]),
  // Building 555, beside the REEF.
  MLAB: pinned("Marine Biotechnology Laboratory", [-119.843275, 34.407969]),
  // Building 520 (MSRB).
  MSB: pinned("Marine Science Research Building", [-119.842223, 34.41255]),
  // Off campus, so no pin: one downtown pin would zoom the schedule map
  // out over the whole city.
  NCEAS: { name: "NCEAS (1021 Anacapa St, downtown Santa Barbara)" },
  "570": pinned("Building 570", [-119.843491, 34.416476]),
  // Trailer 942 (Physics), west of Broida Hall; not in OpenStreetMap, so
  // the position comes from the user.
  "942": pinned("Trailer 942", [-119.843915, 34.413938]),
  "477": pinned("Building 477", [-119.848507, 34.413656]),
};

/** UCSB's placeholders for classes without a regular room. */
const NO_ROOM_LABELS: Record<string, string> = {
  "ON LINE": "Online",
  "NO ROOM": "To be determined",
  "ROOM TBD": "To be determined",
  "DEPT ROOM": "Arranged by department",
  "OFF CAMP": "Off campus",
  "OUT SPACE": "Outdoors",
  "TRACK FIELD": "Track field",
};

/** Rooms that UCSB names rather than numbers. */
const NAMED_ROOMS: Record<string, string> = {
  "CAMPB HALL": "Campbell Hall",
  "EMBAR HALL": "Embarcadero Hall",
  "MUSIC LLCH": "Lotte Lehmann Concert Hall",
  "PLLOK THTR": "Pollock Theater",
  "IV THEA1": "Isla Vista Theater 1",
  "IV THEA2": "Isla Vista Theater 2",
};

export interface ResolvedLocation {
  /** Text to show, for example "Phelps Hall 2524" or "Online". */
  label: string;
  building?: Building;
  room?: string;
  /** Present only when the building has a map pin. */
  coordinates?: [number, number];
  link?: string;
  /** True for "Online", "To be determined" and similar non-rooms. */
  placeholder: boolean;
}

/**
 * Turn a UCSB location ("HSSB 1173", "ON LINE", "CAMPB HALL") into what to
 * display, with a map link when the building is known.
 */
export const resolveLocation = (
  location: string | null | undefined
): ResolvedLocation | null => {
  const text = location?.trim().replace(/\s+/g, " ");
  if (!text) return null;

  const placeholder = NO_ROOM_LABELS[text.toUpperCase()];
  if (placeholder) return { label: placeholder, placeholder: true };

  const [code, ...rest] = text.split(" ");
  const room = rest.join(" ");
  const building = buildings[code];

  if (!building) return { label: text, room, placeholder: false };

  const label =
    NAMED_ROOMS[text.toUpperCase()] ??
    // A room without digits is part of the building's name ("HALL").
    (room && /\d/.test(room) ? `${building.name} ${room}` : building.name);

  return {
    label,
    building,
    room,
    coordinates: building.location,
    link: building.link,
    placeholder: false,
  };
};

/** Main campus, between Storke Tower and the Library. */
export const UCSB_CENTER: [number, number] = [-119.8475, 34.4135];
