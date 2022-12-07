class arkBSList extends arkBSDataLoad {
	constructor(name, dataSource, options) {
		super(name, dataSource, options);

		this.readBSElements();

		return this;
	}

	readBSElements() {
		if (this.options.tabbed) {
			// It's a tabbed list, so we have two subelements: the tabs list, and their contents
			this.elements.tabs = $(this.elements.main).children().first();
			this.elements.tabcontent = $(this.elements.main).children().eq(1);
		} else {
			// not tabbed list.
			let eltype = $(this.elements.main).prop('nodeName');
			// Then list ust be <ul>, <ol>, or <div>
			if (!['UL','OL','DIV'].includes(eltype)) {
				alert(`arkBSList readBSElements ${this.name}: type isn't ul, ol, or div`);
				return;
			}
			this.elements.mainType = eltype;
			// Must also be of class list-group
			if (!$(this.elements.main).hasClass('list-group')) {
				alert(`arkBSList readBSElements ${this.name}: not list-group`);
				return;
			}
		}
	}

	updateDisplay() {
		if (this.options.tabbed) {
			// tabbed list
			try {
				this.elements.tabs.empty();
				this.elements.tabcontent.empty();
				//let number = 1;
				let tabs = `<div class="list-group" id="${this.name}-list-tab" role="tablist">`;
				let tabcontent = `<div class="tab-content" id="${this.name}-nav-tabContent">`;
				this.data.forEach((r, ri) => {
					let text = this.options.print(r);
					let content = this.options.printContent(r);
					let rowid = this.options.rowid(r);
					tabs += '<a class="list-group-item list-group-item-action' + /*(number == 1 ? ' active' : '') +*/ `" id="${this.name}-${rowid}" data-bs-toggle="list" href="#tab-${this.name}-${rowid}" role="tab" aria-controls="tab-${this.name}-${rowid}" data-index="${ri}">` + text + '</a>';
					tabcontent += `<div class="tab-pane fade` + /*(number++ == 1 ? ' show active' : '') +*/ `" id="tab-${this.name}-${rowid}" role="tabpanel" aria-labelledby="${this.name}-${rowid}">` + content + '</div>';
				});
				this.elements.tabs.append(tabs + '</div>');
				this.elements.tabcontent.append(tabcontent + '</div>');

				// defines event for all tabs: when selected update this.selectedIndex
				let tabElms = document.querySelectorAll(`[id="${this.name}-list-tab"] a[data-bs-toggle="list"]`);
				let yesthis = this;
				tabElms.forEach(function(tabElm) {
					tabElm.addEventListener('shown.bs.tab', function (event) {
						//console.log('selectedIndex', $(event.target).data('index'));
						yesthis.selectedIndex = $(event.target).data('index'); // newly activated tab
						if (yesthis.options.onSelect)
							yesthis.options.onSelect(yesthis.getRecord());
						//event.relatedTarget // previous active tab
					});
				});
				
				// selects first tab
				let firstTab = new bootstrap.Tab($(this.elements.tabs).children().first());
				firstTab.show();
			} catch(e) {
				alert('arkBSList updateDisplay 1', e);
				console.log(e);
			}

		} else {
			// not tabbed
			try {
				let result = '';
				let buttonsBehavior = this.options.buttonsBehavior ?? 'default';
				this.data.forEach((r, ri) => {
					let text = this.options.print(r);
					let buttons = '';
					//let rowid = this.options.rowid(r);
					// ...add id="${this.name}-${rowid}"

					// check options.buttons
					if (this.options.buttons)
						this.options.buttons.forEach((bt, bti) => {
							buttons += `<button type="button" class="btn btn-light btn-sm list-button" data-list-button="${bti}">${bt.text}</button>`;
						});
					
					if (['UL','OL'].includes(this.elements.mainType))
						result += `<li class="list-group-item list-group-item-action`
						+ (buttonsBehavior == 'hidden' ? ' d-flex justify-content-between align-items-start' : '')
						+ `" data-index="${ri}">`
						+ (buttonsBehavior == 'hidden' ? `<div class="ms-2 me-auto">${text}</div>` : text)
						+ buttons + '</li>';
					else
						result += `<div class="list-group-item list-group-item-action`
						+ (buttonsBehavior == 'hidden' ? ' d-flex justify-content-between align-items-start' : '')
						+ `" data-index="${ri}">`
						+ (buttonsBehavior == 'hidden' ? `<div class="ms-2 me-auto">${text}</div>` : text)
						+ buttons + '</div>';
				});
				$(this.elements.main).empty().append(result);

				if (buttonsBehavior == 'hidden')
					$('button.list-button').hide();

				if (this.options.selectable) {
					// on click list element
					$(this.elements.main).children().click((event) => {
						let target = event.target;
						// check if we got a child element by mistake
						// child?
						if (!$(event.target).data('index') && $(event.target.parentNode).data('index'))
							target = event.target.parentNode;
						// grandchild?
						else if (!$(event.target).data('index') && !$(event.target.parentNode).data('index') && $(event.target.parentNode.parentNode).data('index'))
							target = event.target.parentNode.parentNode;

						
						this.selectedIndex = $(target).data('index');

						// deactivate previously selected item
						$(target).siblings().removeClass('active');
						$(target).siblings().attr('aria-current', false);
						if (buttonsBehavior == 'hidden')
							$(target).siblings().children('div .list-button').hide();

						// activate selected item
						$(target).addClass('active');
						$(target).attr('aria-current', true);
						if (buttonsBehavior == 'hidden')
							$(target).children('div .list-button').show();

						if (this.options.onSelect)
							this.options.onSelect(this.getRecord());
					});

					// on click list buttons
					if (this.options.buttons)
						this.options.buttons.forEach((bt, bti) => {
							$(`button.list-button[data-list-button="${bti}"]`).click((event) => {
								bt.onclick($(event.target.parentElement).data('index'));
							});
						});
				}
			} catch(e) {
				alert('arkBSList updateDisplay 2', e);
				console.log(e);
			}	
		}
	}
	
}
