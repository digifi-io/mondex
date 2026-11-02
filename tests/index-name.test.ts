import { generateNameForIndex, prepareIndex } from "../src/utils";

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
