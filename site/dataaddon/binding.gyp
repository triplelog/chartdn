{
  'targets': [
    {
      	'target_name': 'binding',
      	"cflags": [ "-std=c++17" ],
        "cflags_cc": [ "-std=c++17" ],
      	'sources': [ 'datatypes.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    }
  ]
}