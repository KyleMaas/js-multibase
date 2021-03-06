/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const { encodeText, decodeText } = require('../src/util')
const multibase = require('../src')
const constants = require('../src/constants.js')

/** @type {Array<[BaseName, string, string]>} */
const unsupportedBases = []

/**
 * @typedef {import('../src/types').BaseName} BaseName
 */

/** @type {Array<[BaseName, string, string]>} */
const supportedBases = [

  ['base16', decodeText(Uint8Array.from([0x01])), 'f01'],
  ['base16', decodeText(Uint8Array.from([15])), 'f0f'],
  ['base16', 'f', 'f66'],
  ['base16', 'fo', 'f666f'],
  ['base16', 'foo', 'f666f6f'],
  ['base16', 'foob', 'f666f6f62'],
  ['base16', 'fooba', 'f666f6f6261'],
  ['base16', 'foobar', 'f666f6f626172'],

  ['base32', 'yes mani !', 'bpfsxgidnmfxgsibb'],
  ['base32', 'f', 'bmy'],
  ['base32', 'fo', 'bmzxq'],
  ['base32', 'foo', 'bmzxw6'],
  ['base32', 'foob', 'bmzxw6yq'],
  ['base32', 'fooba', 'bmzxw6ytb'],
  ['base32', 'foobar', 'bmzxw6ytboi'],

  ['base32pad', 'yes mani !', 'cpfsxgidnmfxgsibb'],
  ['base32pad', 'f', 'cmy======'],
  ['base32pad', 'fo', 'cmzxq===='],
  ['base32pad', 'foo', 'cmzxw6==='],
  ['base32pad', 'foob', 'cmzxw6yq='],
  ['base32pad', 'fooba', 'cmzxw6ytb'],
  ['base32pad', 'foobar', 'cmzxw6ytboi======'],

  ['base32hex', 'yes mani !', 'vf5in683dc5n6i811'],
  ['base32hex', 'f', 'vco'],
  ['base32hex', 'fo', 'vcpng'],
  ['base32hex', 'foo', 'vcpnmu'],
  ['base32hex', 'foob', 'vcpnmuog'],
  ['base32hex', 'fooba', 'vcpnmuoj1'],
  ['base32hex', 'foobar', 'vcpnmuoj1e8'],

  ['base32hexpad', 'yes mani !', 'tf5in683dc5n6i811'],
  ['base32hexpad', 'f', 'tco======'],
  ['base32hexpad', 'fo', 'tcpng===='],
  ['base32hexpad', 'foo', 'tcpnmu==='],
  ['base32hexpad', 'foob', 'tcpnmuog='],
  ['base32hexpad', 'fooba', 'tcpnmuoj1'],
  ['base32hexpad', 'foobar', 'tcpnmuoj1e8======'],

  ['base32z', 'yes mani !', 'hxf1zgedpcfzg1ebb'],
  ['base58flickr', 'yes mani !', 'Z7Pznk19XTTzBtx'],
  ['base58btc', 'yes mani !', 'z7paNL19xttacUY'],

  ['base64', '÷ïÿ', 'mw7fDr8O/'],
  ['base64', 'f', 'mZg'],
  ['base64', 'fo', 'mZm8'],
  ['base64', 'foo', 'mZm9v'],
  ['base64', 'foob', 'mZm9vYg'],
  ['base64', 'fooba', 'mZm9vYmE'],
  ['base64', 'foobar', 'mZm9vYmFy'],
  ['base64', '÷ïÿ🥰÷ïÿ😎🥶🤯', 'mw7fDr8O/8J+lsMO3w6/Dv/CfmI7wn6W28J+krw'],

  ['base64pad', 'f', 'MZg=='],
  ['base64pad', 'fo', 'MZm8='],
  ['base64pad', 'foo', 'MZm9v'],
  ['base64pad', 'foob', 'MZm9vYg=='],
  ['base64pad', 'fooba', 'MZm9vYmE='],
  ['base64pad', 'foobar', 'MZm9vYmFy'],

  ['base64url', '÷ïÿ', 'uw7fDr8O_'],
  ['base64url', '÷ïÿ🥰÷ïÿ😎🥶🤯', 'uw7fDr8O_8J-lsMO3w6_Dv_CfmI7wn6W28J-krw'],

  ['base64urlpad', 'f', 'UZg=='],
  ['base64urlpad', 'fo', 'UZm8='],
  ['base64urlpad', 'foo', 'UZm9v'],
  ['base64urlpad', 'foob', 'UZm9vYg=='],
  ['base64urlpad', 'fooba', 'UZm9vYmE='],
  ['base64urlpad', 'foobar', 'UZm9vYmFy'],
  ['base64urlpad', '÷ïÿ🥰÷ïÿ😎🥶🤯', 'Uw7fDr8O_8J-lsMO3w6_Dv_CfmI7wn6W28J-krw==']
]

/**
 * @param {string} label
 * @param {(encodeText:(text: string) => Uint8Array) => void} def
 */
const they = (label, def) => {
  it(`${label} (Uint8Array)`, def.bind(null, encodeText))
}

describe('multibase', () => {
  describe('generic', () => {
    it('fails on no args', () => {
      expect(multibase).to.throw(Error)
    })

    it('fails on no buf', () => {
      expect(() => {
        // @ts-expect-error
        multibase('base16')
      }).to.throw(Error)
    })

    they('fails on non supported name', (encode) => {
      expect(() => {
        // @ts-expect-error
        multibase('base1001', encode('meh'))
      }).to.throw(Error)
    })

    they('fails on non supported code', (encode) => {
      expect(() => {
        // @ts-expect-error
        multibase('6', encode('meh'))
      }).to.throw(Error)
    })
  })

  for (const elements of supportedBases) {
    const name = elements[0]
    const input = elements[1]
    const output = elements[2]
    const base = constants.names[name]
    describe(name, () => {
      they('adds multibase code to valid encoded Uint8Array, by name', (encode) => {
        if (typeof input === 'string') {
          const buf = encode(input)
          const encodedBuf = encode(base.encode(buf))
          const multibasedBuf = multibase(base.name, encodedBuf)
          expect(decodeText(multibasedBuf)).to.equal(output)
        } else {
          const encodedBuf = encode(base.encode(input))
          const multibasedBuf = multibase(base.name, encodedBuf)
          expect(decodeText(multibasedBuf)).to.equal(output)
        }
      })

      they('adds multibase code to valid encoded Uint8Array, by code', (encode) => {
        const buf = encode(input)
        const encodedBuf = encode(base.encode(buf))
        const multibasedBuf = multibase(base.code, encodedBuf)
        expect(decodeText(multibasedBuf)).to.equal(output)
      })

      they('fails to add multibase code to invalid encoded Uint8Array', (encode) => {
        const nonEncodedBuf = encode('^!@$%!#$%@#y')
        expect(() => {
          multibase(base.name, nonEncodedBuf)
        }).to.throw(Error)
      })

      it('isEncoded string', () => {
        const name = multibase.isEncoded(output)
        expect(name).to.equal(base.name)
      })

      they('isEncoded Uint8Array', (encode) => {
        const multibasedStr = encode(output)
        const name = multibase.isEncoded(multibasedStr)
        expect(name).to.equal(base.name)
      })
    })
  }
})

describe('multibase.encode ', () => {
  for (const elements of supportedBases) {
    const name = elements[0]
    const input = elements[1]
    const output = elements[2]
    describe(name, () => {
      they('encodes a Uint8Array', (encode) => {
        const buf = encode(input)
        const multibasedBuf = multibase.encode(name, buf)
        expect(decodeText(multibasedBuf)).to.equal(output)
      })
    })
  }

  it('should allow base32pad full alphabet', () => {
    const encodedStr = 'ctimaq4ygg2iegci7'
    const decoded = multibase.decode(encodedStr)

    const encoded = multibase.encode('c', decoded)
    expect(encodedStr).to.be.eq(decodeText(encoded))
  })
})

describe('multibase.decode', () => {
  for (const elements of supportedBases) {
    const name = elements[0]
    const input = elements[1]
    const output = elements[2]
    describe(name, () => {
      it('decodes a string', () => {
        const multibasedStr = output
        const buf = multibase.decode(multibasedStr)
        expect(buf).to.eql(encodeText(input))
      })

      they('decodes a Uint8Array', (encode) => {
        const multibasedBuf = encode(output)
        const buf = multibase.decode(multibasedBuf)
        expect(buf).to.eql(encodeText(input))
      })
    })
  }
})

for (const elements of unsupportedBases) {
  const name = elements[0]
  describe(name, () => {
    they('fails on non implemented name', (encode) => {
      expect(() => {
        multibase(name, encode('meh'))
      }).to.throw(Error)
    })
  })
}

describe('multibase.names', () => {
  it('includes all base names', () => {
    Object.keys(constants.names).forEach(name => {
      expect(Object.keys(multibase.names)).to.include(name)
    })
  })

  it('base names are frozen', () => {
    expect(Object.isFrozen(multibase.names)).to.be.true()
  })
})

describe('multibase.codes', () => {
  it('includes all base codes', () => {
    Object.keys(constants.codes).forEach(code => {
      expect(Object.keys(multibase.codes)).to.include(code)
    })
  })

  it('base codes are frozen', () => {
    expect(Object.isFrozen(multibase.codes)).to.be.true()
  })
})

describe('multibase.isEncoded', () => {
  it('should not throw for non String/Uint8Array input', () => {
    const invalidInputs = [
      null,
      undefined,
      false,
      0,
      {},
      [],
      /[a-z]/,
      () => {},
      Symbol('test')
    ]

    invalidInputs.forEach(input => {
      // @ts-ignore
      expect(() => multibase.isEncoded(input)).to.not.throw()
      // @ts-ignore
      expect(multibase.isEncoded(input)).to.be.false()
    })
  })
})
