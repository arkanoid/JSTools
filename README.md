# JSTools
Bunch of JavaScript functions/classes to help me in node.js development.

For use with Express, Knex, Bootstrap, Handlebars.

**Class documentation below is a work in progress**

# class arkBSCard

Loads data through ajax (or other functions), keeps that data, display it through Bootstrap (BS) components like Cards, adds buttons and controls.
To be used client side.

## Example HTML

Something like the code below is expected to be found in the page.
```HTML
<div class="card" id="myname">

	<!-- You can use the image feature, if you want. Not used by arkBSCard -->
	<img src="..." class="card-img-top" alt="...">
	
	<!-- card-body can be used to display a single record, or selected info. Or for a search form. -->
	<div class="card-body"></div>
	
	<!-- One list-group, if present, will be used to display several records. -->
	<ul class="list-group list-group-flush"></ul>

	<!-- another card-body can be added, if you need to display more info on the same card. -->
	<div class="card-body"></div>
</div>
```

## constructor (name, dataSource)
* **name** (_string_): Name identifier for this control. 
Upon creating the object it will locate a HTML element with id equal to this name. See the example HTML above.
* **dataSource** (_string, object or function_): Where to obtain the data from. It is expected the data comes in the format a Knex query will return, be it several records or a single record. The 3 possible types are:
	* string: an URL to be called trough AJAX (with GET)
	* object: also data for an AJAX call, in this form:
```JavaScript
{
	url: '...',
	method: 'POST'	// or GET
}
```
	* function: A callback that should return the data.


# class arkFormCare

Manages a form. Used to collect data from the form and send to ajax.

What the form must have:
* id property in the format `form_myname`, where _myname_ is the name passed to the constructor.
* Its fields' id should follow the format: `myname_myfield`, where _myname_ is the same as above, and _myfield_ is the field name. When submitting data, the fields' values will be collected in an object using _myfield_ as the key of each field.
* The submit button must be actually `type="button"`, but have an id of the format `submit_myname` (actually any id which name begins with _submit_ will be used). Must be inside the form.
* Similarly a button named `cancel_myname` will be used accordingly, if found.

## constructor (name, options)

* **name** (_string_): Form name. The HTML element &lt;form$gt; is expected to have an id of 'form_name'. Ex: `<form id="form_users">`, the name is 'users'.

It's also expected to be used as a **prefix** for every form field. All fields inside this form must have a name in the format 'formname_fieldname', where _fieldname_ must be a key in the data dictionary.

The constructor will look for a button named 'btn_new_formname' (anywhere in the page). If one is found, the form will be hidden on page load, and displayed when this button is clicked. If an option `buttonNew` is passed, its name will be used instead. The same works for editing records, the option being `buttonEdit` and default name 'btn_edit_formname'.

* **options** (_object_): Several options.
	* **BSDataLoad** (_optional object_): an object from arkBSDataLoad class, like arkBSCard or arkBSList. If specified certain actions will synchronize with it; for example, after the form finishes saving, the BSDataLoad will reload its data.
	* **urlNew** (_optional string_): Address for a POST ajax access. Used when the form is used to create a new record.
	* **parentElement** (_optional string or object_): Parent element containing the form. If specified, actions that affect the entire form (like hide() and show()) will also apply to the parent. If string, it's the HTML id; if object it's a jQuery.
	* **buttonNew** (_optional string_): ID of a button element that will be used to put the form into 'new' state (create new record). If not specified, a button named 'btn_new_formname' will be looked for instead.
	* **buttonEdit** (_optional string_): Same as above but for editing records. The default name is 'btn_edit_formname'.
	* **primaryKeys** (_optional string or array_): List of fields that are primary keys to the data. When in **edit** mode, those fields will be kept in the data being sent through ajax. When in **new** mode these fields will be removed from data before send. 
