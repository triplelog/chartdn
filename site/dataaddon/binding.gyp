{
  'targets': [
    {
      	'target_name': 'binding',
      	'sources': [ 'binding.cpp' ],
      	'include_dirs': [
			"<!@(node -p \"require('node-addon-api').include\")"
		],
		'libraries': [],
		'dependencies': [
			"<!(node -p \"require('node-addon-api').gyp\")"
		],
    }
  ]
}