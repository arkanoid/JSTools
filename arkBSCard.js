var _arkBSCard = new Map();

class arkBSCard {
	name;
	dataSource;
	elements = {};
	
	constructor(name, dataSource, options) {
		this.name = name;

		if (typeof dataSource == 'string')
			this.dataSource = {
				url: dataSource,
				method: 'GET'
			};
		else
			this.dataSource = dataSource;

		this.elements.main = document.getElementById(name);
		if (!this.element.main)
			throw new Error(`arkBSCard: no element with id="${name}" found`);
		this.readBSElements();

		_arkBSCard.set(name, this);
	}
}
