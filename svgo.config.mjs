export default {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    'removeDimensions',
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
    { name: 'convertPathData', params: { floatPrecision: 2 } },
    { name: 'removeUnknownsAndDefaults', params: { keepDataAttrs: true } },
    'removeUselessStrokeAndFill',
    'removeUselessDefs',
    'removeXMLNS'
  ]
};
