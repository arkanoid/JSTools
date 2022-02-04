# JSTools
Bunch of JavaScript functions/classes to help me in node.js development.

For use with Express, Knex, Bootstrap, Handlebars.

**Class documentation below is a work in progress**

# class arkDictionaryClient

Database dictionaries meant to work with data retrieved from knex.js. As the name suggests this is the **client side** dictionary class, but the server side one (arkDictionary) inherits from this.

## Data structure

General defition of a dictionary for the class constructor.

```JavaScript
const dict = new Map([
		 ['db_field_name1', {...} ],
		 ['db_field_name2', {...} ]
	])
```
The keys (db_field_name1, etc) are actual names of the table columns. Each one points to an object ({...}) that have the following keys:

* **label**: string describing the field. For showing in the UI.
* **type**: one of the following: 'string', 'number', 'boolean', 'json'.
* **realFieldName**: (__optional__): If defined will be used instead of db_field_name. Useful for defining the same field more than once for different references (foreign table joins).
* **showEdit** (__optional, default true__): Whether this field should be used in a <form>. The class has methods for generating/reading HTML forms. Since by default this field is true, you only need to specify this key if the value is **false**.
* **showInCardList** (__optional, default true__): Whether this should appear in a <ul> list inside a <card>.
* **canBeNull** (__optional, default false__): If true, blank values will be substituted with null before updating/inserting.
* **primaryKey** (__optional, default false__): Defines if this field is a primary key. Most tables will have only one field but some can have more than one.
* **selections** (__optional__): Array with names of selections.
**	Selections are field groupings for different queries. For example, let's say a table has the fields: id, name, description, class_id (where this last one references another table).  Fields id and name have selections: ['short','long']. Field class_id has selections: ['long']. In the relevant methods, if 'short' is passed as selection name, only the fields [id, name] will be used. If 'long' is the selection name only the fields [id, name, class_id] will be used.
* **references** (__optional__): Field references another table.
** Example structure:
```JavaScript
{	field: 'id',		// field name in foreign table
		table: 'tableb',	// foreign table
		foreignData: ['name', 'abc']	// fields from foreign table
}
```
** In the structure above, foreign table fields will be added to queries using the table name and _ as alias. Ex: "tableb.name AS tableb_name"
* **keyOf** (__optional__): Defines an object from where to take the 'real' data from. Useful for ENUM db fields.
**  The object will have a structure like this:
```JavaScript
exampleEnum = {
    "enumField": {
      "name": "The Enum Field" // more presentable than "enumField"
      // ... there may be other fields, for customized use
    }
}
```
 
## Example Dictionaries

For the examples below, suppose the following tables in MySQL for a web game.

### Users table
| Field         | Type                                        |
|---------------|---------------------------------------------|
| id            | int(10) unsigned (auto_increment, primary) |
| name          | varchar(32)                                 |
| email         | varchar(255)                                |
| password      | varchar(255)                                |
| created_at    | timestamp                                   |
| last_logon    | timestamp                                   |
| tags          | longtext (actually json)                                   |

### Characters table
| Field        | Type             |
|--------------|------------------|
| id           | int(10) unsigned (auto_increment, primary) |
| name         | varchar(32)      |
| class_id     | int(10) unsigned |
| user_id      | int(10) unsigned |

### Classes table
| Field       | Type             |
|-------------|------------------|
| id          | int(10) unsigned (auto_increment, primary) |
| name        | varchar(64)      |

### Users dictionary

This is a very simple dictionary.

```JavaScript
// separate file with only the data structure; so this same file can be used for both client and server side.
// users.dict.js
const dictStructUsers = new Map ([
    ['id', {
		label: 'ID',
		type: 'number',
		showEdit: false,
		showInCardList: false,
		primaryKey: true
    }],
    ['name', {
		label: 'Name',
		type: 'string',
		showEdit: false
    }],
    ['email', {
		label: 'Email',
		type: 'string',
		showEdit: false,
		showInCardList: false
    }],
	['password', {
		label: 'Password',
		type: 'password',
		showEdit: false,
		showInCardList: false
	}],
	['created_at', {
		label: 'Creation date',
		type: 'string',
		showEdit: false
	}],
	['last_logon', {
		label: 'Last logon',
		type: 'string',
		showEdit: false
	}],
	['tags', {
		label: 'Tags',
		type: 'json'
	}]
])
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = dictStructUsers
}
```

```JavaScript
// another file to be passed to the client (alongside arkDictionaryClient.js)
// users.client.js
const dictUsers = new arkDictionaryClient(dictStructUsers)
// ... other client side code as needed
```

## Methods

### adjustData(data)
Adjusts a set of data before sending trough Knex/Ajax.
* param {array} data: Each field inside <data> is converted as appropriated (parseInt() for number, etc.)


# class arkDictionary

Database dictionaries meant to work alongside knex.js.

The dictionary is a Map of the table fields and some descriptive data.

## Examples

### Users dictionary

This example shows an entire file, which usually would be in an Express project under projectname/db/users.js
This is a very simple dictionary. Note that the example also makes use of arkBaseDBClass.
```JavaScript
const knex = require('../knex/knex')
const arkBaseDBClass = require('../JSTools/arkBaseDBClass')['arkBaseDBClass']
const arkDictionary = require('../JSTools/arkDictionary')

const dict = new Map ([
    ['id', {
		label: 'ID',
		type: 'number',
		showEdit: false,
		showInCardList: false,
		primaryKey: true
    }],
    ['name', {
		label: 'Name',
		type: 'string',
		showEdit: false
    }],
    ['email', {
		label: 'Email',
		type: 'string',
		showEdit: false,
		showInCardList: false
    }],
	['password', {
		label: 'Password',
		type: 'password',
		showEdit: false,
		showInCardList: false
	}],
	['created_at', {
		label: 'Creation date',
		type: 'string',
		showEdit: false
	}],
	['last_logon', {
		label: 'Last logon',
		type: 'string',
		showEdit: false
	}],
	['tags', {
		label: 'Tags',
		type: 'json'
	}]
])

class DBUsers extends arkBaseDBClass {
    constructor() {
		let d = new arkDictionary(dict, 'users');
		super(knex, 'users', d);
    }
}

module.exports = new DBUsers();
```

### Characters dictionary

This example file would be named projectname/db/characters.js

Note the use of different selections.
* Selection 'index' has the fields: id, name, class_id (which joins with classes table for the classes.name field)
* Using no selection name, all fields would be used, including user_id which is out of selection 'index'.
```JavaScript
const knex = require('../knex/knex')
const arkBaseDBClass = require('../JSTools/arkBaseDBClass')['arkBaseDBClass']
const arkDictionary = require('../JSTools/arkDictionary')

const dict = new Map([
    ['id', {
		label: 'ID',
		type: 'number',
		showEdit: false,
		showInCardList: false,
		primaryKey: true,
		selections: ['index']
    }],
    ['name', {
		label: 'Name',
		type: 'string',
		showEdit: true,
		selections: ['index']
    }],
    ['class_id', {
		label: 'class_id',
		type: 'integer',
		showEdit: false,
		showInCardList: false,
		references: { field: 'id', table: 'classes',
					  foreignData: ['name'] },
		selections: ['index']
    }],
	['user_id', {
		label: 'user_id',
		type: 'integer',
		showEdit: false,
		showInCardList: false,
		references: { field: 'id', table: 'users',
					  foreignData: ['name'] }
	}]
])

class DBCharacters extends arkBaseDBClass {
    constructor() {
		let d = new arkDictionary(dict, 'characters');
		super(knex, 'characters', d);
    }
}

module.exports = new DBCharacters();
```


### Dictionary example uses

See arkBaseDBClass examples.


# class arkBaseDBClass


# class arkDataBox

For client side. This class controls a group of HTML elements, populating/updating them with data from AJAX. The elements can be:
* An <ol> or <ul> list (Bootstrap style)
** Simple list or with tabbable panes
* A <div> (Bootstrap **Card**)
** Can display a single record (card body) or several records (card list)
** Can use both card body and list

When creating the object the "id" attribute must be passed. So in the HTML file you just need one of these:

```HTML
<div id="name"></div>

<!-- or -->

<ul id="name"></ul>

<!-- or -->

<ol id="name"></ol>
```
Object will be created as:
```JavaScript
new arkDataBox('name')
```

## Adding sources

After creating the arkDataBox object, at least one data source must be added.

* Method: addDataSource(source, name, single)
** source: string, object or function to obtain the data. It is expected the data comes in the form a Knex query will return, be it several records or a single record.
*** string: an URL to be called trough AJAX (with GET)
*** object: also data for AJAX, in this form:
```JavaScript
{
	url: '...',
	method: 'post'	// or get
}
```
*** function: should return the data
** name: optional string, default 'main'. The name of this data source for identification by other methods. If 'main' it will be the main data source used to populate/update this arkDataBox. At least this data source must be specified.
** single: optional boolean, default false. If true data returned by source is a single record.