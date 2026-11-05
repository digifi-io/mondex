import { findConfigConflicts, generateNameForIndex, prepareIndex } from "../src/utils";

describe("Tests index creation", function () {
  // Disable console and MongoDB
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    [{ a: 1, b: -1 }, "a_1_b_-1"],
    [{ a: 1, b: 1 }, "a_1_b_1"],
    [{ a: -1, b: -1 }, "a_-1_b_-1"],
    [{ a: -1, b: 1 }, "a_-1_b_1"],
    [{ a: 1, "@isUnique": true, "@manual": true }, "a_1"],
  ])("can generate name of index", (index: any, expected) => {
    expect(generateNameForIndex(index)).toEqual(expected);
  });
});

describe("prepareIndex", () => {
  it("moves the options out of the index keys", () => {
    const index: any = {
      updatedAt: 1,
      "@isUnique": true,
      "@partialFilterExpression": { updatedAt: { $exists: true } },
      "@manual": true,
    };

    expect(prepareIndex(index)).toEqual({
      name: "updatedAt_1",
      keys: { updatedAt: 1 },
      isUnique: true,
      partialFilterExpression: { updatedAt: { $exists: true } },
      isManual: true,
    });
  });
});

describe("findConfigConflicts", () => {
  it("returns no conflicts for a valid configuration", () => {
    const configs: any = [
      { collection: "a", indexes: [{ x: 1 }, { x: 1, y: 1 }] },
      { collection: "b", indexes: [{ x: 1 }] },
    ];

    expect(findConfigConflicts(configs)).toEqual([]);
  });

  it("reports indexes that differ only in options", () => {
    const configs: any = [
      {
        collection: "a",
        indexes: [{ x: 1 }, { x: 1, "@partialFilterExpression": { y: { $exists: true } } }],
      },
    ];

    expect(findConfigConflicts(configs)).toEqual(["a: more than one index is named x_1"]);
  });

  it("reports a collection listed twice", () => {
    const configs: any = [
      { collection: "a", indexes: [{ x: 1 }] },
      { collection: "a", indexes: [{ y: 1 }] },
    ];

    expect(findConfigConflicts(configs)).toEqual(["a: the collection is listed more than once"]);
  });
});
