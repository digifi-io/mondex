import { getIndexDiff, IndexDiff } from "../src/utils";
import { MongoIndex, PreparedIndex } from "../src";

describe("getIndexDiff", () => {
  const existingIndexes: Record<string, MongoIndex[]> = {
    collection1: [
      { name: "index1", keys: { field1: 1 } },
      { name: "index2", keys: { field2: -1 } },
    ],
    collection2: [{ name: "index3", keys: { field3: 1 } }],
  };

  const givenIndexes: Record<string, PreparedIndex[]> = {
    collection1: [
      { name: "index1", keys: { field1: 1 } },
      { name: "index2", keys: { field2: -1 } },
      { name: "index4", keys: { field4: 1 } },
    ],
    collection2: [
      { name: "index3", keys: { field3: 1 } },
      { name: "index5", keys: { field5: 1 } },
    ],
  };

  it("returns the correct index diff when there are indexes to create and drop", () => {
    const expectedIndexDiff = [
      {
        collection: "collection1",
        toCreate: [{ name: "index4", keys: { field4: 1 } }],
        toDrop: [],
        toSkip: [],
      },
      {
        collection: "collection2",
        toCreate: [{ name: "index5", keys: { field5: 1 } }],
        toDrop: [],
        toSkip: [],
      },
    ];

    const indexDiff = getIndexDiff(existingIndexes, givenIndexes);

    expect(indexDiff).toEqual(expectedIndexDiff);
  });

  it("returns the correct index diff when there are indexes to drop", () => {
    const expectedIndexDiff = [
      {
        collection: "collection1",
        toCreate: [],
        toDrop: [{ name: "index2", keys: { field2: -1 } }],
        toSkip: [],
      },
    ];

    const indexDiff = getIndexDiff(existingIndexes, {
      collection1: [{ name: "index1", keys: { field1: 1 } }],
      collection2: [{ name: "index3", keys: { field3: 1 } }],
    });

    expect(indexDiff).toEqual(expectedIndexDiff);
  });

  it("returns an empty index diff when there are no changes", () => {
    const expectedIndexDiff: IndexDiff = [];
    const indexDiff = getIndexDiff(existingIndexes, {
      collection1: [
        { name: "index1", keys: { field1: 1 } },
        { name: "index2", keys: { field2: -1 } },
      ],
      collection2: [{ name: "index3", keys: { field3: 1 } }],
    });

    expect(indexDiff).toEqual(expectedIndexDiff);
  });

  it("ignores the _id_ index", () => {
    const expectedIndexDiff: IndexDiff = [];
    const indexDiff = getIndexDiff(
      {
        collection1: [
          { name: "_id_", keys: { field1: 1 } },
          { name: "index1", keys: { field1: 1 } },
          { name: "index2", keys: { field2: -1 } },
        ],
        collection2: [{ name: "index3", keys: { field3: 1 } }],
      },
      {
        collection1: [
          { name: "index1", keys: { field1: 1 } },
          { name: "index2", keys: { field2: -1 } },
        ],
        collection2: [{ name: "index3", keys: { field3: 1 } }],
      }
    );

    expect(indexDiff).toEqual(expectedIndexDiff);
  });
});

describe("getIndexDiff with manual indexes", () => {
  const manualIndex: PreparedIndex = {
    name: "updatedAt_1",
    keys: { updatedAt: 1 },
    isManual: true,
  };

  it("skips a manual index that is not in the database", () => {
    const indexDiff = getIndexDiff(
      { collection1: [{ name: "index1", keys: { field1: 1 } }] },
      { collection1: [{ name: "index1", keys: { field1: 1 } }, manualIndex] }
    );

    expect(indexDiff).toEqual([
      { collection: "collection1", toCreate: [], toDrop: [], toSkip: [manualIndex] },
    ]);
  });

  it("keeps a manual index that is in the database", () => {
    const indexDiff = getIndexDiff(
      { collection1: [{ name: "updatedAt_1", keys: { updatedAt: 1 } }] },
      { collection1: [manualIndex] }
    );

    expect(indexDiff).toEqual([]);
  });

  it("recreates a manual index whose options changed", () => {
    const existingIndex: MongoIndex = {
      name: "updatedAt_1",
      keys: { updatedAt: 1 },
      unique: true,
    };

    const indexDiff = getIndexDiff(
      { collection1: [existingIndex] },
      { collection1: [manualIndex] }
    );

    expect(indexDiff).toEqual([
      { collection: "collection1", toCreate: [manualIndex], toDrop: [existingIndex], toSkip: [] },
    ]);
  });
});
