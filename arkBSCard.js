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
		} else {
		    // no card-img-overlay but there is an <img class="img-fluid"> element?
			el = $(this.elements.main).find('img.img-fluid');
			if (el) {
				this.elements.img = el[0];
				if (this.options.imgsrc && typeof this.options.imgsrc == 'string')
				    $(this.elements.img).attr('src', this.options.imgsrc);
			    //console.log('got this img', el);
			}
		}
		// check if there's a card-body
		// if no card-img-overlay was found, then this will be the 1st
	    el = $(this.elements.main).find('.card-body');
	    //console.log('found card-body?', el, first_body);
		if (first_body == 0) {
			if (Array.isArray(el) || typeof el == 'object')
				this.elements.body = el[0];
			else
				this.elements.body = el;
			//this.elements.body = (Array.isArray(el) ? el[0] : el);
		    this.elements.bodyclass = 'card-body';
			console.log('this.elements.body', this.elements.body);
		} else
			this.elements.otherbodies = [ el[0] ];
		// multiple card-body
		if (el.length > 1) {
			if (!this.elements.otherbodies)
				this.elements.otherbodies = [];
			for (let i = 1; i < el.length; i++)
				this.elements.otherbodies.push(el[i]);
		}
		console.log('this.elements.otherbodies', this.elements.otherbodies);

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

	    //console.log('this.elements.body', this.elements.body, 'this.options.body', this.options.body);
		if (this.elements.body && this.options.body) {
			try {
				//console.log('this.elements.body');
				//console.log(this.elements.body);
				//console.log('this.elements.otherbodies');
				//console.log(this.elements.otherbodies);
				let content;
				// main body
				try {
					content = this.options.body(this.data);
				} catch(e) {
					alert('Under the lantern it is written:', this.name, e);
				}
				if (typeof content != 'undefined' && content)
					$(this.elements.body).empty().append(content);
				// other bodies, if any
				/*
				if (this.elements.otherbodies)
					this.elements.otherbodies.forEach((o, i) => {
						try {
							content = this.options.body(this.data, i);
						} catch(e) {
							alert('Beneath the pool it is written:', this.name, e);
							console.log('Beneath the pool it is written:', this.name, e);
						}
						if (typeof content != 'undefined' && content)
							$(o).empty().append(content);
					});
				*/
				
				if (this.elements.img && this.options.imgsrc && typeof this.options.imgsrc == 'function')
					$(this.elements.img).attr('src', this.options.imgsrc(this.data));
			} catch(e) {
				alert(`The ${this.name} pea flew to the moon`);
			}
		}
	}
}
