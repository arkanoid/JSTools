const assert = require('assert');
const arkDataDictClient = require('../arkDataDictClient');

const dictStructTest1 = new Map([
	['id', {
		label: 'ID',
		type: 'number',
		primaryKey: true
	}],
	['name', {
		label: 'Name',
		type: 'string'
	}]
])

const dictStructTest2 = new Map([
	['resource_id', {
		label: 'Resource',
		type: 'number',
		primaryKey: true,
		references: { field: 'id', table: 'resource',
					  foreignData: ['name', 'description'] }
	}],
	['user_id', {
		label: 'User',
		type: 'number',
		primaryKey: true,
		references: { field: 'id', table: 'users',
					  foreignData: ['name'] }
	}],
	['level', {
		label: 'Level',
		type: 'number'
	}]
])

const dataTest1 = { id: 1, name: 'Um' }
const dataTest2 = { resource_id: 14, user_id: 71, level: 3 }

describe('arkDataDictClient tests', function() {
	let dictTest1 = new arkDataDictClient(dictStructTest1, 'test1');
	let dictTest2 = new arkDataDictClient(dictStructTest2, 'test2');
	describe('generateStringId test', () => {
		it('should generate string 1', (done) => {
			assert.equal(dictTest1.generateStringId(dataTest1), '1')
			done()
		})
		it('should generate string 14-71', (done) => {
			assert.equal(dictTest2.generateStringId(dataTest2), '14-71')
			done()
		})
	})
})
