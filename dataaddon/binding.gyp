{
  'targets': [
    {
      	'target_name': 'binding',
      	"cflags": [ "-std=c++17", "-O3" ],
        "cflags_cc": [ "-std=c++17", "-O3" ],
      	'sources': [ 'datatypes.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    },
    {
      	'target_name': 'bindingArray',
      	"cflags": [ "-std=c++17", "-O3" ],
        "cflags_cc": [ "-std=c++17", "-O3" ],
      	'sources': [ 'arrayops.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    }
  ]
}