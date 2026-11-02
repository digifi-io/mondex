## mondex

> CLI tool to create and manage MongoDB indexes using code

## Installation

Install the package globally or alternatively you can also use `npx`

```bash
npm install -g mondex
```

## Usage

Here is the list of mondex commands that you can use

* `pull` — creates index configuration file by pulling existing indexes from your database
* `plan` — shows the indexes to be created or dropped
* `apply` — applies the changes from the configuration file (i.e. apply or drop indexes)

The list of options accepted by mondex are

```bash
Usage: mondex <command> [options]

Commands:
  pull                       Creates index configuration from database
  plan                       Shows the index changes to be applied to database
  apply                      Applies the index changes from configuration to database

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

  -f, --file <file>          path to indexes file (defaults to indexes.json in current directory)
  -i --uri <uri>             connection string for MongoDB
  -d, --db <database>        database name
```

### Configuration

The index configuration file is an array of objects with each object having two properties:

- `collection`: Name of the collection
- `indexes`: Array of indexes to be created

Index format is same as the one you would pass to `db.collection.createIndex()` in the mongo shell.

Given below is a sample JSON file representing sample index configuration:

```javascript
[
  {
    "collection": "user_resource_progress",
    "indexes": [
      { "resourceId": -1, "resourceType": -1, "userId": -1 },
      { "deletedAt": -1, "createdAt": -1 }
    ]
  },
  {
    "collection": "user",
    "indexes": [
      { "email": -1 },
      { "userType": -1, "createdAt": -1 },
      { "organizationId": -1, "userId": -1, "isActive": -1 }
    ]
  }
]
```

Once you have the JSON file ready, you can use the `mondex` to start managing your indexes.

### Unique and TTL Indexes

You can also specify the unique and TTL indexes as a part of index configuration. Mondex supports two special fields `@isUnique` and `@expireAfterSeconds` as a part of index configuration; if found in the list of columns, relevant index will be considered as a unique or TTL index.

For example, `user.email` in the following configuration will be considered as a unique index, while `activity_log.createdAt` [will be a TTL index](https://www.mongodb.com/docs/manual/core/index-ttl/)

```json
[
  {
    "collection": "user",
    "indexes": [
      { "email": -1, "@isUnique": true },
      { "userType": -1, "createdAt": -1 },
      { "organizationId": -1, "userId": -1, "isActive": -1 }
    ]
  },
  {
    "collection": "activity_log",
    "indexes": [
      { "createdAt": -1, "@expireAfterSeconds": 86400 },
    ]
  }
]
```

### Manual Indexes

Every `apply` drops the indexes that are not in the configuration file, but only in the collections listed in it. Mark an index with `@manual` to keep it in the configuration without creating it everywhere: `apply` doesn't create a manual index that is missing, and doesn't drop it where it exists. Create it by hand only in the databases that need it, with the name mondex generates (the default MongoDB name for the same keys, e.g. `updatedAt_1`):

```json
[
  {
    "collection": "applications",
    "indexes": [
      { "updatedAt": 1, "@manual": true }
    ]
  }
]
```

```javascript
db.applications.createIndex({ updatedAt: 1 })
```

If its options in the database differ from the configuration, `apply` recreates it like any other index.

### Errors

`apply` doesn't stop on a failed change: it applies the remaining ones, lists the failures at the end and exits with code 1.

## Examples

> Show the indexes that will be created and dropped

```bash
mondex plan --uri mongodb://localhost:27017 --db mydb --file ./indexes.json
```

> Apply the changes from index configuration

```bash
mondex apply --uri mongodb://localhost:27017 --db mydb --file ./indexes.json
```

> Pull existing database indexes in the configuration file

```bash
mondex  pull --uri mongodb://localhost:27017 --db mydb --file ./indexes.json
```

## License

MIT &copy; [Kamran Ahmed](https://twitter.com/kamrify)
