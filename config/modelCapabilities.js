const modelCapabilities = {
  'gemma2-9b-it':                                   { vision: false },
  'llama-3.3-70b-versatile':                        { vision: false },
  'llama-3.1-8b-instant':                           { vision: false },
  'llama-guard-3-8b':                               { vision: false },
  'llama3-70b-8192':                                { vision: false },
  'deepseek-r1-distill-llama-70b':                  { vision: false },
  'meta-llama/llama-4-maverick-17b-128e-instruct':  { vision: true },
  'meta-llama/llama-4-scout-17b-16e-instruct':      { vision: true },
}

module.exports = modelCapabilities;