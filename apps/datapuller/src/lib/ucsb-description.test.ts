import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  boundarySpaces,
  buildVocabulary,
  repairDescription,
} from "./ucsb-description";

// Real descriptions as UCSB's API returned them.
const ANTH_3 =
  "An introduction to archaeology and the history of humankind from the earlie st times through the advent of literate civilization and cities, also proce sses of cultural change and the importance of archaeology to people and soc ieties today. Partly self-paced learning.";

const ECE_10A =
  "The objective of the course is to establish the foundations of analog and d igital circuits. The course will introduce the student to the power of abst raction, resistive networks, network analysis, nonlinear analysis and the d igital abstraction.";

// Other descriptions supply the vocabulary, as a full quarter would.
const CORPUS = [
  "The earliest societies and the processes that shaped them.",
  "Digital design and abstraction in modern systems. Digital logic.",
  "Gender and the division of labor in societies.",
  "An introduction to the processes of digital abstraction.",
];

const vocabulary = buildVocabulary([ANTH_3, ECE_10A, ...CORPUS]);

/**
 * Build text in which `left` ends on the 75th character, so the space
 * between `left` and `right` sits on a line boundary.
 */
const atBoundary = (left: string, right: string) => {
  const padding = "lorem ".repeat(20).slice(0, 75 - left.length - 1) + " ";
  const text = `${padding}${left} ${right}`;
  assert.equal(text[75], " ");
  return text;
};

describe("boundarySpaces", () => {
  it("finds the space after every 75 characters", () => {
    assert.deepEqual(boundarySpaces(ANTH_3), [75, 151, 227]);
  });

  it("finds nothing in short or unwrapped text", () => {
    assert.deepEqual(boundarySpaces("A short description."), []);
    assert.deepEqual(boundarySpaces("x".repeat(200)), []);
  });
});

describe("buildVocabulary", () => {
  it("counts words but skips fragments next to a line boundary", () => {
    assert.ok((vocabulary.get("archaeology") ?? 0) >= 2);
    assert.equal(vocabulary.get("earlie"), undefined);
    assert.equal(vocabulary.get("st"), undefined);
    assert.equal(vocabulary.get("igital"), undefined);
  });

  it("ignores case and surrounding punctuation", () => {
    const counts = buildVocabulary(["Cities, cities; (CITIES)."]);
    assert.equal(counts.get("cities"), 3);
  });
});

describe("repairDescription", () => {
  it("rejoins words that were split at a line boundary", () => {
    assert.equal(
      repairDescription(ANTH_3, vocabulary),
      "An introduction to archaeology and the history of humankind from the earliest times through the advent of literate civilization and cities, also processes of cultural change and the importance of archaeology to people and societies today. Partly self-paced learning."
    );
    assert.equal(
      repairDescription(ECE_10A, vocabulary),
      "The objective of the course is to establish the foundations of analog and digital circuits. The course will introduce the student to the power of abstraction, resistive networks, network analysis, nonlinear analysis and the digital abstraction."
    );
  });

  it("keeps a boundary space that separates two real words", () => {
    const text = atBoundary("division", "of labor in societies");

    assert.match(
      repairDescription(text, vocabulary),
      / division of labor in societies$/
    );
  });

  it("does not merge two common words that happen to form another word", () => {
    const corpus = buildVocabulary([
      "in in in in in in to to to to to to into",
    ]);
    const text = atBoundary("in", "to the end");

    assert.match(repairDescription(text, corpus), / in to the end$/);
  });

  it("merges when the joined word is far more common than a fragment", () => {
    const corpus = buildVocabulary([
      "understanding understanding understanding understanding understanding",
      "understand ing",
    ]);
    const text = atBoundary("understand", "ing of how");

    assert.match(repairDescription(text, corpus), /understanding of how$/);
  });

  it("joins a split rare word when a fragment is too short to be a word", () => {
    const text = atBoundary("sexualit", "y and more");

    assert.match(repairDescription(text, new Map()), /sexuality and more$/);
  });

  it("leaves two unknown long words apart", () => {
    const text = atBoundary("governmental", "agencies and more");

    assert.match(
      repairDescription(text, new Map()),
      / governmental agencies and more$/
    );
  });

  it("never joins across punctuation or digits", () => {
    assert.match(
      repairDescription(atBoundary("learning.", "Partly"), new Map()),
      /learning\. Partly$/
    );
    assert.match(
      repairDescription(atBoundary("section", "2 only"), new Map()),
      /section 2 only$/
    );
  });

  it("collapses repeated whitespace and handles empty input", () => {
    assert.equal(repairDescription("a  b \n c", vocabulary), "a b c");
    assert.equal(repairDescription(null, vocabulary), "");
    assert.equal(repairDescription("", vocabulary), "");
  });
});
