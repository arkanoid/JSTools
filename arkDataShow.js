// Meant to be used client-side.
class arkDataBox {
	// HTML id
	#rootElement
	#rootElementType
	
	// List updated by method addDataSource()
	#dataSources = new Map()
	
	/**
	 * @param {string} rootElement ID name of HTML element (div, ol, ul)
	 */
    constructor(rootElement, single) {
		this.#rootElement = rootElement
		// stores the element type (DIV, UL, OL)
		this.#rootElementType = document.getElementById(rootElement)
    }

	/**
	 * @param {object|function} source
	 */
	addDataSource(source, name='main', single=false) {
		this.#dataSources.set(name, {
			source: source,
			single: single
		})
	}
}
