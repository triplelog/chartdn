{
  'targets': [
    {
      	'target_name': 'binding',
      	'sources': [ 'datatypes.cpp', 'isNumber.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    }
  ]
}