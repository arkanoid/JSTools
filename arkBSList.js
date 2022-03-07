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
		}

		// defines event for all tabs: when selected update this.selectedIndex
		let tabElms = document.querySelectorAll(`[id="${this.name}-list-tab"] a[data-bs-toggle="list"]`);
		let yesthis = this;
		tabElms.forEach(function(tabElm) {
			tabElm.addEventListener('shown.bs.tab', function (event) {
				//console.log('selectedIndex', $(event.target).data('index'));
				yesthis.selectedIndex = $(event.target).data('index'); // newly activated tab
				//event.relatedTarget // previous active tab
			});
		});

		// selects first tab
		let firstTab = new bootstrap.Tab($(this.elements.tabs).children().first());
		firstTab.show();
	}
}
