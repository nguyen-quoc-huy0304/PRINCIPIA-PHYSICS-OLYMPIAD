package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"os"
	"path/filepath"
)

func main() {
	root, err := filepath.Abs(filepath.Join("desktop", "icons"))
	if err != nil { fatal(err) }
	pngPath, icoPath := filepath.Join(root, "icon.png"), filepath.Join(root, "icon.ico")
	input, err := os.Open(pngPath)
	if err != nil { fatal(err) }
	source, err := png.Decode(input)
	closeErr := input.Close()
	if err != nil { fatal(err) }
	if closeErr != nil { fatal(closeErr) }

	bounds := source.Bounds()
	side := bounds.Dx()
	if bounds.Dy() > side { side = bounds.Dy() }
	if side < 512 { side = 512 }
	canvas := image.NewRGBA(image.Rect(0, 0, side, side))
	offset := image.Pt((side-bounds.Dx())/2, (side-bounds.Dy())/2)
	draw.Draw(canvas, image.Rectangle{Min: offset, Max: offset.Add(bounds.Size())}, source, bounds.Min, draw.Over)

	var pngBuffer bytes.Buffer
	if err := png.Encode(&pngBuffer, canvas); err != nil { fatal(err) }
	if err := os.WriteFile(pngPath, pngBuffer.Bytes(), 0644); err != nil { fatal(err) }

	frame := resizeNearest(canvas, 256)
	var frameBuffer bytes.Buffer
	if err := png.Encode(&frameBuffer, frame); err != nil { fatal(err) }
	if err := writeICO(icoPath, frameBuffer.Bytes()); err != nil { fatal(err) }
	fmt.Printf("Generated %dx%d transparent PNG and 256x256 ICO: %s\n", side, side, icoPath)
}

func resizeNearest(source image.Image, size int) *image.RGBA {
	dst := image.NewRGBA(image.Rect(0, 0, size, size))
	bounds := source.Bounds()
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			sx := bounds.Min.X + x*bounds.Dx()/size
			sy := bounds.Min.Y + y*bounds.Dy()/size
			dst.Set(x, y, source.At(sx, sy))
		}
	}
	return dst
}

func writeICO(path string, pngFrame []byte) error {
	file, err := os.Create(path)
	if err != nil { return err }
	defer file.Close()
	header := []uint16{0, 1, 1}
	for _, value := range header {
		if err := binary.Write(file, binary.LittleEndian, value); err != nil { return err }
	}
	entry := []any{byte(0), byte(0), byte(0), byte(0), uint16(1), uint16(32), uint32(len(pngFrame)), uint32(22)}
	for _, value := range entry {
		if err := binary.Write(file, binary.LittleEndian, value); err != nil { return err }
	}
	_, err = file.Write(pngFrame)
	return err
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
