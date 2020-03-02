{
  'targets': [
    {
      	'target_name': 'binding',
      	'sources': [ 'withgyp.cpp' ],
      	"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		]
    }
  ]
}