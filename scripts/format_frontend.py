import jsbeautifier, glob
opts = jsbeautifier.default_options()
opts.indent_size = 2

for f in glob.glob(r"front-end\\js\\*.js"):
    with open(f, 'r', encoding='utf-8') as fh:
        s = fh.read()
    new = jsbeautifier.beautify(s, opts)
    if new != s:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new)
        print("Formatted", f)

for f in glob.glob(r"front-end\\css\\*.css"):
    with open(f, 'r', encoding='utf-8') as fh:
        s = fh.read()
    new = jsbeautifier.beautify(s, opts)
    if new != s:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new)
        print("Formatted", f)

for f in glob.glob(r"front-end\\*.html"):
    with open(f, 'r', encoding='utf-8') as fh:
        s = fh.read()
    new = jsbeautifier.beautify(s, opts)
    if new != s:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new)
        print("Formatted", f)
