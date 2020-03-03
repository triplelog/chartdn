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
    }
  ]
}