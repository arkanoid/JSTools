class arkBSCard extends arkBSDataLoad {
	constructor(name, dataSource, options) {
		//this.name = name;
		super(name, dataSource, options);

		this.readBSElements();

		return this;
	}

	readBSElements() {
		let el, first_body = 0;

		// first check if there's a card-img-overlay
		el = $(this.elements.main).children('.card-img-overlay');
		//console.log('looking for card-img-overlay');
		//console.log(el);
		//console.log(this.elements.main);
		if (el.length) {
			this.elements.body = el[0];
			this.elements.bodyclass = 'card-img-overlay';
			//console.log('card-img-overlay found');
			first_body = 1;
			//localize also the <img> element
			el = $(this.elements.main).children('img');
			if (el) {
				this.elements.img = el[0];
				if (this.options.imgsrc && typeof this.options.imgsrc == 'string')
					$(this.elements.img).attr('src', this.options.imgsrc);
			}
		}
		// check if there's a card-body
		// if no card-img-overlay was found, then this will be the 1st
		el = $(this.elements.main).children('.card-body');
		if (first_body == 0) {
			this.elements.body = el[0];
			this.elements.bodyclass = 'card-body';
		} else
			this.elements.otherbodies = [ el[0] ];
		// multiple card-body
		if (el.length > 1) {
			if (!this.elements.otherbodies)
				this.elements.otherbodies = [];
			for (let i = 1; i < el.length; i++)
				this.elements.otherbodies.push(el[i]);
		}

		// check if there's a list-group
		el = $(this.elements.main).children('.list-group').first();
		if (el)
			this.elements.list = el;
	}

	updateDisplay() {
		if (this.elements.list && this.options.list && this.data)
			try {
				let list = '';
				this.elements.list.empty();
				this.data.forEach((r, ri) => {
					let text = this.options.list(r);
					list += '<li class="list-group-item">' + text + '</li>';
				});
				this.elements.list.append(list);
			} catch(e) {
				alert(`But ${this.name} doesn't eat raisins`);
			}
		else if (!this.data)
			console.log(`The can labeled ${this.name} is empty.`);
			
		if (this.elements.body && this.options.body)
			try {
				$(this.elements.body).empty().append(this.options.body(this.data));
				if (this.elements.img && this.options.imgsrc && typeof this.options.imgsrc == 'function')
					$(this.elements.img).attr('src', this.options.imgsrc(this.data));
			} catch(e) {
				alert(`The ${this.name} pea flew to the moon`);
			}
	}
}
