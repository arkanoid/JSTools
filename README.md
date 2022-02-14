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
* **edit** (_optional, object or boolean, default false_): If false (or not specified) this field won't be used in a &lt;form&gt;. The class has methods for generating/reading HTML forms. If you want the field to appear in forms, specify it as an object with the following fields:
** **position** (_string_): How to position this field in relation to others. Valid values are:
*** 'single': Field will occupy an entire row.
*** 'shared': Field will share row with other fields.
** **type** (_optional string_): HTML type field. Usually will be inferred from data type. Valid values are:
*** 'textarea'
*** 'select' - additional fields: **select_value** (complete field name); **select_text** (complete field name)
* **showInCardList** (__optional, default true__): Whether this should appear in a &lt;ul&gt; list inside a &lt;card&gt;.
* **canBeNull** (__optional, default false__): If true, blank values will be substituted with null before updating/inserting.
* **primaryKey** (__optional, default false__): Defines if this field is a primary key. Most tables will have only one field but some can have more than one.
* **selections** (__optional__): Array with names of selections.
**	Selections are field groupings for different queries. For example, let's say a table has the fields: id, name, description, class_id (where this last one references another table).  Fields id and name have selections: ['short','long']. Field class_id has selections: ['long']. In the relevant methods, if 'short' is passed as selection name, only the fields [id, name] will be used. If 'long' is the selection name only the fields [id, name, class_id] will be used.
* **references** (_optional object_): Field references another table. This object can have the following fields:
** **field** (_string_): Field name in the foreign table to join, usually its primary key.
** **table** (_string_): Foreign table name.
* **nested** (_optional boolean, default false_): If true the table is a **nested query**, that means, each record from the main query will receive the result of a subquery in this field.
** **foreignData** (_array_): List of fields from foreign table to insert into select.
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
// projectname/db/users.dict.js
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
* param {array} data: Each field inside &lt;data&gt; is converted as appropriated (parseInt() for number, etc.)


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

Class used to abstract all knex.js use. Individual database classes can inherit from this. Files, usually in directory projectname/db, can be like this:

```JavaScript
// example file: projectname/db/users.js
const knex = require('../knex/knex');
const arkBaseDBClass = require('../JSTools/arkBaseDBClass')['arkBaseDBClass'];
const arkDictionary = require('../JSTools/arkDictionary');
const dictStructUsers = require('./users.dict');

class DBUsers extends arkBaseDBClass {
    constructor() {
		let d = new arkDictionary(dictStructUsers, 'users');
		super(knex, 'users', d);
    }
}
module.exports = new DBUsers();
```

The above just defines a bare bones class, passing the **knex** object and corresponding arkDictionary. That's enough for the most common SQL queries, updates, inserts, and so on. If customized Knex/SQL is needed one can define more methods in DBUsers above.

## constructor(knex, tableName, dictionary)
* **knex** (_object_): knex.js connection object.
* **tableName** (_string_): The database table name.
* **dictionary** (_object class arkDictionary_): The data dictionary.


# class arkDataDisplay

For client sid usee. This class controls a group of HTML elements, populating/updating them with data from AJAX. The elements can be:
* An &lt;ol&gt; or &lt;ul&gt; list (Bootstrap style)
** Simple list or with tabbable panes
* A &lt;div&gt; (Bootstrap **Card**)
** Can display a single record (card body) or several records (card list)
** Can use both card body and list
* A &lt;table&gt;

When creating the object the "id" attribute of at least one element must be passed. So in the HTML file you just need one of these elements:

```HTML
// one of the following
<div id="myname"></div>
<ul id="myname"></ul>
<ol id="myname"></ol>
<table id="myname"></table>
```
Object would be created as this (simple example):
```JavaScript
var name = new arkDataDisplay({ elementID: 'myname' }, { source: '/urlpath...' } );
```

# Constructor: arkDataDisplay(displayOptions, dataSourceOptions)
* param **displayOptions** (_object_): See method addDisplay.
* param **dataSourceOptions** (_object_): See method addDataSource.

## Method addDisplay(options)

The parameter options is an object with the following properties:

* **name** (_optional string_): Identifies the display. Default value is 'main' if not specified. All arkDataDisplay objects must have a display named 'main'.
* **elementID** (_string_): ID property of the HTML element used for display.
* **style** (_optional string_): Depends on the base HTML element used.
** DIV: style can be 'list', 'card', 'tabbed-list'. Default is list.
Obs: if the style is 'tabbed-list', the HTML code is expected to be like this example:
```HTML
<div id="myname" class="row">
	<div class="col-4 col-sm-6"></div> <!-- or any other col- size, as you want -->
	<div class="col-8 col-sm-6"></div>
</div>
```
** UL, OL and TABLE: style is ignored.

## Method: addDataSource(options)

The parameter options is an object with the following properties:

* **name** (_optional string_): Identifies the data source. Default value is 'main' if not specified. All arkDataDisplay objects must have a data source named 'main'.
* **source** (_string, object or function_): Where to obtain the data. It is expected the data comes in the form a Knex query will return, be it several records or a single record. The 3 possible types are:
** string: an URL to be called trough AJAX (with GET)
** object: also data for an AJAX call, in this form:
```JavaScript
{
	url: '...',
	method: 'post'	// or get
}
```
** function: A callback that should return the data.
* **single** (_optional boolean_): Default false. If true data returned by source is a single record (like the one returned by knex.js first()).
* **dictionary** (_arkDictionaryClient_)

## Adding displays and data sources

After creating the arkDataDisplay object, more data sources and displays may be added.

Example:
```JavaScript
let prod = new arkDataDisplay({ elementID: 'products' }, { source: '/products' })
	.addDataSource({ name: 'tabContent', source: getContent })
	.addDisplay({ name: 'tabContent', elementID: 'tab-content', style: 'card' })
	.update();
```


## Updating the data

The method update() will call AJAX (if any), update the data, then update the HTML element.

If you want the data to be showed when the page is loaded, this method should be called as soon as the object is configured.

### Simple example

```HTML
<div id="products"></div>
```

```JavaScript
// configure and update as soon as the page finishes loading
// assuming the URL /products returns AJAX data
$(document).ready(function() {
	let showChars = new arkDataDisplay('products').addDataSource('/products').update();
})
```
