package physics
import("math";"testing")
func TestProjectileRange(t *testing.T){r,e:=ProjectileRange(10,math.Pi/4,9.80665);if e!=nil||math.Abs(r-10.197162)>.01{t.Fatalf("r=%v err=%v",r,e)}}
func TestRejectInvalid(t *testing.T){if _,e:=ProjectileRange(-1,.2,9.8);e==nil{t.Fatal("expected invalid speed")};if _,ok:=Mean(nil);ok{t.Fatal("empty mean accepted")}}
func TestMean(t *testing.T){m,ok:=Mean([]float64{2,4,6});if !ok||m!=4{t.Fatalf("m=%v ok=%v",m,ok)}}
