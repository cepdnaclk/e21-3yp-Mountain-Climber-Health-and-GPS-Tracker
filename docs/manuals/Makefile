.PHONY: all user-manual design-manual clean

LATEXMK = pdflatex -interaction=nonstopmode -halt-on-error

all: user-manual design-manual

user-manual:
	cd user-manual && $(LATEXMK) user_manual.tex && $(LATEXMK) user_manual.tex

design-manual:
	cd design-manual && $(LATEXMK) design_manual.tex && $(LATEXMK) design_manual.tex

clean:
	cd user-manual && rm -f *.aux *.log *.toc *.lof *.lot *.out *.bbl *.blg *.fls *.fdb_latexmk *.synctex.gz
	cd design-manual && rm -f *.aux *.log *.toc *.lof *.lot *.out *.bbl *.blg *.fls *.fdb_latexmk *.synctex.gz
