// client-side form mnagement

class arkFormCare {
	name;
	options;
	element;
	status;

	constructor(name, options) {
		this.name = name;
		this.options = options;
		
		try {
			// the <form> element itself
			this.element = $(`#form_${name}`);
			if (!this.element)
				throw new Error(`arkFormCare form ${name} not found`);

			// submit button
			this.options.elementBtnSubmit = $(this.element).children("button[id*='submit']");
			this.options.elementBtnSubmit.click(() => {
				this.submit();
			});

			// cancel button
			this.options.elementBtnCancel = $(this.element).children("button[id*='cancel']");
			if (this.options.elementBtnCancel)
				this.options.elementBtnCancel.click(() => {
					this.cancel();
				});
		} catch(e) {
			alert(`Form not found: ${name}`);
		}

		if (typeof this.options.parentElement == 'string')
			this.options.parentElement = $(`#${this.options.parentElement}`);
		
		this.status = '';

		// new record button
		let btnname = (this.options.buttonNew ? this.options.buttonNew : 'btn_new_' + name);
		this.options.elementBtnNew = $(`#${btnname}`);
		if (this.options.elementBtnNew) {
			this.hide();
			this.options.elementBtnNew.click(() => {
				if (!this.status) {
					this.show();
					this.status = 'new';
				}
			});
		}

		// edit record button
		btnname = (this.options.buttonEdit ? this.options.buttonEdit : 'btn_edit_' + name);
		this.options.elementBtnEdit = $(`#${btnname}`);
		if (this.options.elementBtnEdit) {
			this.hide();
			this.options.elementBtnEdit.click(() => {
				if (!this.status) {
					this.show();
					this.populateForm();
					this.status = 'edit';
				}
			});
		}

		return this;
	}

	populateForm() {
		//preencha os campos do form com os dados previamente carregados de um BSDataLoad
		if (this.options.BSDataLoad) {
			let row = this.options.BSDataLoad.getRecord();
			for (let r in row) {
				let el = $(`#${this.name}_${r}`);
				if (el)
					el.val(row[r]);
				else
					console.log(`populateForm() not found: #${this.name}_${r}`);
			}
		}
	}

	isPrimaryKey(fieldname) {
		if (this.options.primaryKeys) {
			if (typeof this.options.primaryKeys == 'string')
				return (fieldname == this.options.primaryKeys);
			else
				return this.options.primaryKeys.includes(fieldname);
		} else
			return false;
	}
	
	submit() {
		// checks if form is creating a new record, or editing
		if (this.status != 'new' && this.status != 'edit') {
			console.log(`Form ${this.name} not in edit neither create mode`);
			return;
		}

		let controls = $(`#form_${this.name} :input`);
		let values = {};
		let fieldname;
		for(let c in controls) {
			if (!isNaN(parseInt(c)))
				try {
					if ($(controls[c]) && $(controls[c]).prop
						&& ['INPUT','TEXTAREA','SELECT'].includes($(controls[c]).prop('nodeName'))) {
						fieldname = $(controls[c]).prop('id').split('_')[1];
						if (!this.isPrimaryKey(fieldname))
							values[ fieldname ] = $(controls[c]).val();
					}
				} catch(e) {
					console.log('arkFormCare submit: error trying to select '+c);
				}
		}

		this.oldStatus = this.status;
		this.status = 'sending';
		$.ajax({
			url: this.options.urlNew,
			method: (this.status == 'new' ? 'POST' : 'PUT'),
			data: values,
			success: (result) => {
				this.status = '';
				alert(this.status == 'new' ? 'New record saved.' : 'Record updated.');
				this.hide();
				if (this.options.BSDataLoad)
					this.options.BSDataLoad.update();
				resolve(result);
			},
			error: (jqXHR, status, thrown) => {
				this.status = this.oldStatus;
				alert(`Failure saving record on form: ${this.name} ${status} (${jqXHR.statusText})`);
			}
		});
	}

	cancel() {
		// checks if form is creating a new record, or editing
		if (this.status == 'sending') {
			console.log(`Form ${this.name} is awaiting for a transaction to end`);
			return;
		}
		if (this.status != 'new' && this.status != 'edit') {
			console.log(`Form ${this.name} not in edit neither create mode`);
			return;
		}

		this.status = '';
		this.hide();
	}

	show() {
		if (this.options.parentElement)
			this.options.parentElement.show();
		else
			this.element.show();
	}

	hide() {
		if (this.options.parentElement)
			this.options.parentElement.hide();
		else
			this.element.hide();
	}
}
