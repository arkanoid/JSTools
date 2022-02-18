# JSTools
Bunch of JavaScript functions/classes to help me in node.js development.

For use with Express, Knex, Bootstrap, Handlebars.

**Class documentation below is a work in progress**

# class arkDataDictClient

Database dictionaries meant to work with data retrieved from knex.js. As the name suggests this is the **client side** dictionary class, but the server side one (arkDataDict) inherits from this.

## Data structure

General defition of a dictionary for the class constructor.

```JavaScript
const dict = new Map([
		 ['db_field_name1', {...} ],
		 ['db_field_name2', {...} ]
	])
```
The keys (db_field_name1, etc) are actual names of the table columns. Each one points to an object ({...}) that have the following keys:

* **label**: (_optional string_): For display in the UI. If not specified, default is the key (`db_field_name` in the example above) with the first letter capitalized.
* **type**: one of the following: 'string', 'number', 'boolean', 'json'.
* **realFieldName**: (__optional__): If defined will be used instead of db_field_name. Useful for defining the same field more than once for different references (foreign table joins).
* **edit** (_optional, object or boolean, default false_): If false (or not specified) this field won't be used in a &lt;form&gt;. The class has methods for generating/reading HTML forms. If you want the field to appear in forms, specify it as an object with the following fields:
	* **position** (_string_): How to position this field in relation to others. Valid values are:
		* 'single': Field will occupy an entire row.
		* 'shared': Field will share row with other fields.
	* **type** (_optional string_): HTML type field. Usually will be inferred from data type. Valid values are:
		* 'textarea'
		* 'select' - additional fields: **select_value** (complete field name); **select_text** (complete field name)
* **display** (_optional, object or boolean, default true_): Options for how to display this field. If not specified the field will always be displayed (when used by methods like toString()) with default options. If false the field will never be displayed at all. If an object, the following properties control its appearance:
	* **position** (_string, default 'shared'_): How to position this field in relation to others. Valid values are:
		* 'single': Field will occupy an entire row (line break after it).
		* 'shared': Field will share row with other fields (inline).
	* **tab** (_optional boolean, default false_): Only will work if the **style** passed to `arkDataDisplay.addDisplay()` is 'tabbed-list'. This field will be shown in the lateral tab. If it has the `references.nested = true` property, all fields in property `references.foreignData` will be put into the tab.
	* **label** (_string, default 'b'_): How to display the field label.
		* 'b': Label will be enclosed in &lt;b&gt; element.
		* Other string values: will be used as a formatting string. Inside it, the sequence `{label}` will be substituted by the label and `{value}` by the value. Note there is no `$` before the `{}`.
			* Example: `'[{label}] -> <span class="abc">{value}</span>'`
	* **notShowIn** (_array, default []_): array of style strings where **NOT** show this field. The styles are the same used in the property **style** of the method **addDisplay()** in the class **arkDataDisplay**. So, for example, if you want this field to **not** be displayed if the style is 'card' but in all others, **notShowIn** will be `['card']`.
* **canBeNull** (__optional, default false__): If true, blank values will be substituted with null before updating/inserting.
* **primaryKey** (__optional, default false__): Defines if this field is a primary key. Most tables will have only one field but some can have more than one.
* **selections** (__optional__): Array with names of selections.
	*	Selections are field groupings for different queries. For example, let's say a table has the fields: id, name, description, class_id (where this last one references another table).  Fields id and name have selections: ['short','long']. Field class_id has selections: ['long']. In the relevant methods, if 'short' is passed as selection name, only the fields [id, name] will be used. If 'long' is the selection name only the fields [id, name, class_id] will be used.
* **references** (_optional object_): Field references another table. This object can have the following fields:
	* **field** (_string_): Field name in the foreign table to join, usually its primary key.
	* **table** (_string_): Foreign table name.
* **nested** (_optional boolean, default false_): If true the table is a **nested query**, that means, each record from the main query will receive the result of a subquery in this field.
	* **foreignData** (_array_): List of fields from foreign table to insert into select.
	* Example structure:
```JavaScript
{	field: 'id',		// field name in foreign table
		table: 'tableb',	// foreign table
		foreignData: ['name', 'abc']	// fields from foreign table
}
```
	* In the structure above, foreign table fields will be added to queries using the table name and _ as alias. Ex: "tableb.name AS tableb_name"
* **keyOf** (__optional__): Defines an object from where to take the 'real' data from. Useful for ENUM db fields.
	*  The object will have a structure like this:
```JavaScript
exampleEnum = {
    "enumField": {
      "name": "The Enum Field" // more presentable than "enumField"
      // ... there may be other fields, for customized use
    }
}
```


## Example tables

Example database tables for the data dictionaries examples below. MySQL tables for a web game.

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
| Field | Type                                       |
|-------|--------------------------------------------|
| id    | int(10) unsigned (auto_increment, primary) |
| name  | varchar(64)                                |

### Skills table
| Field | Type                                       |
|-------|--------------------------------------------|
| id    | int(10) unsigned (auto_increment, primary) |
| name  | varchar(64)                                |

### Classes/Skills table
Named classes_skills, N:N relation between classes and skills.
| Field    | Type             |
|----------|------------------|
| class_id | int(10) unsigned |
| skill_id | int(10) unsigned |
| charges  | int(10) unsigned |


## Example data structure

Example of an object to be passed to arkDataDict/arkDataDictClient constructor.


### Characters dictionary

In this example the entire object definition is kept in a separate file, to be later used to create objects arkDataDictClient and/or arkDataDict.

```JavaScript
// separate file with only the data structure; so this same file can be used for both client and server side.
// projectname/db/characters.dict.js
const dictStructCharacters = new Map([
    ['id', {
		label: 'ID',
		type: 'number',
		showInCardList: false,
		primaryKey: true,
		selections: ['index']
    }],
    ['name', {
		label: 'Name',
		type: 'string',
		edit: {
			position: 'single'
		},
		selections: ['index']
    }],
    ['class_id', {
		label: 'class_id',
		type: 'number',
		references: {
			field: 'id', table: 'classes',
			foreignData: ['name'] 
		},
		selections: ['index']
    }],
	['user_id', {
		label: 'user_id',
		type: 'number',
		references: {
			field: 'id', table: 'users',
			foreignData: ['name']
		}
	}]
]);

try {
	if (this === window) {
		// browser
	}
} catch(e) {
    module.exports = dictStructCharacters;
}
```

## constructor(datadict, tableName)
* **datadict** (_object Map_): Map in the format detailed above.
* **tableName** (_string_): Table name in the database. Even if this class is meant for client-side use, this name will be used to create a list of dictionaries.

## Method adjustData(data)
Adjusts a set of data before sending trough Knex/Ajax.
* **data** (_array_): Each field inside &lt;data&gt; is converted as appropriated (parseInt() for number, etc.)

## Method generateStringId(data)
Returns a string with all primary key fields united. Note: param is a RECORD only.
Example: suppose the primary keys in the dictionary are the fields `user_id` and `product_id`. Suppose also **data** is: `{ user_id: 14, product_id: 71, other: 'xyz' }`
Result is: `'14-71'`

## Method filterRecord(record, filter, returnNotList)
Takes a **record** of data and returns a new record, with only the fields that match **filter**.

Fields which have not a datadict definition will automatically go to the second list (see `returnNotList`).

* **record** (_object_): Record data, usually from the database.
* **filter** (_optional, string or function, default '!references'_): This filter will be used to determine which fields will be in the result.
	* If it's a function, it will be called with two arguments: the field value (record) and the field definition in the data dictionary.
	* If it's a string, then one of the predefined filters will be used:
		* '!references': Fields which datadict doesn't have a `references` property.
* **returnNotList** (_optional boolean, default false_): If true, the fields that do NOT match `filter` will be collected and **two** objects will be returned in an array.


# class arkDataDict

Database dictionaries meant to work alongside knex.js, server-side.

This class and its methods basically exist to serve arkBaseDBClass.

## constructor(datadict, tableName)
* **datadict** (_object Map_): Map in the format detailed above. Same as with arkDataDictClient class.
* **tableName** (_string_): Table name in the database.



# class arkBaseDBClass

Class used to abstract all knex.js use. Individual database classes can inherit from this. Files, usually in directory projectname/db, can be like this:

```JavaScript
// example file: projectname/db/users.js
const knex = require('../knex/knex');
const arkBaseDBClass = require('../JSTools/arkBaseDBClass')['arkBaseDBClass'];
const arkDataDict = require('../JSTools/arkDataDict');
const dictStructUsers = require('./users.dict');

class DBUsers extends arkBaseDBClass {
    constructor() {
		let d = new arkDataDict(dictStructUsers, 'users');
		super(knex, 'users', d);
    }
}
module.exports = new DBUsers();
```

The above just defines a bare bones class, passing the **knex** object and corresponding arkDataDict. That's enough for the most common SQL queries, updates, inserts, and so on. If customized Knex/SQL is needed one can define more methods in DBUsers above.

## constructor(knex, tableName, dictionary)
* **knex** (_object_): knex.js connection object.
* **tableName** (_string_): The database table name.
* **dictionary** (_object class arkDataDict_): The data dictionary as an arkDataDict object.

## Method findFirst(where, fields)
* **where** (_object or function_): This parameter will be passed along to .where() Knex method.
* **fields** (_array_): List of database table fields. Will also be passed along to Knex .first().

Returns a **Promise**.

## Method select(selection, where)
* **selection** (_string_): Selection name as defined in the data dictionary field 'selections'.
* **where** (_optional object or function_): Will be passed along to Knex .where() method, if defined.

Returns a **Promise**.

This method will build the query according information in the data dictionary and the selection specified. 
Fields with a 'references' property will create a JOIN clause in the query. 
Fields with a 'references' property **and** a `nested: true` property will be processed as subqueries for each row returned by the main query, and the data returned by the subquery will be inserted into the data from the main query.


# class arkDataDisplay

For client sid usee. This class controls a group of HTML elements, populating/updating them with data from AJAX. The elements can be:
* An &lt;ol&gt; or &lt;ul&gt; list (Bootstrap style)
	* Simple list or with tabbable panes
* A &lt;div&gt; (Bootstrap **Card**)
	* Can display a single record (card body) or several records (card list)
	* Can use both card body and list
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
	* DIV: style can be 'list', 'card', 'tabbed-list'. Default is list.
Obs: if the style is 'tabbed-list', the HTML code is expected to be like this example (mind the `id`s):
```HTML
<div id="myname" class="row">
	<div id="myname-tab" class="col-4 col-sm-6"></div> <!-- or any other col- size, as you want -->
	<div id="myname-content" class="col-8 col-sm-6"></div>
</div>
```
** UL, OL and TABLE: style is ignored.

## Method: addDataSource(options)

The parameter options is an object with the following properties:

* **name** (_optional string_): Identifies the data source. Default value is 'main' if not specified. All arkDataDisplay objects must have a data source named 'main'.
* **source** (_string, object or function_): Where to obtain the data. It is expected the data comes in the form a Knex query will return, be it several records or a single record. The 3 possible types are:
	* string: an URL to be called trough AJAX (with GET)
	* object: also data for an AJAX call, in this form:
```JavaScript
{
	url: '...',
	method: 'post'	// or get
}
```
	* function: A callback that should return the data.
* **single** (_optional boolean_): Default false. If true data returned by source is a single record (like the one returned by knex.js first()).
* **dictionary** (_arkDataDictClient_)

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
