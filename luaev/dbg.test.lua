local debug = require('dbg')('test.debug')
local debug2 = require('dbg')('test.debug2')
local inspect = require 'inspect'
debug('helloworld')
debug('helloworld222', 123)
debug('aha', inspect({
	a = 1,
	b = 2,
	c = {
		complex = {}
	}
}))

debug2("from", "debug", 2)