{
  'targets': [
    {
      	'target_name': 'binding',
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
      	'sources': [ 'withgyp.cpp' ],
    }
  ]
}