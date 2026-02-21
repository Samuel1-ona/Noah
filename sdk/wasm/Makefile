.PHONY: build clean

build:
	GOOS=js GOARCH=wasm go build -o ../public/noah_prover.wasm main.go

clean:
	rm -f ../public/noah_prover.wasm
