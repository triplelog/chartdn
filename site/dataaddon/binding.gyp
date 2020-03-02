{
  'targets': [
    {
      	'target_name': 'binding',
      	'sources': [ 'datatypes.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    }
  ]
}