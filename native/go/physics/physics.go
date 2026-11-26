package physics
import("errors";"math")
var ErrInvalidInput=errors.New("invalid physics input")
func ProjectileRange(speed,angle,gravity float64)(float64,error){if math.IsNaN(speed)||math.IsInf(speed,0)||math.IsNaN(angle)||math.IsInf(angle,0)||math.IsNaN(gravity)||math.IsInf(gravity,0)||speed<0||gravity<=0||angle<0||angle>math.Pi/2{return 0,ErrInvalidInput};return speed*speed*math.Sin(2*angle)/gravity,nil}
func Mean(values []float64)(float64,bool){if len(values)==0{return 0,false};s:=0.0;for _,v:=range values{if math.IsNaN(v)||math.IsInf(v,0){return 0,false};s+=v};m:=s/float64(len(values));if math.IsInf(m,0)||math.IsNaN(m){return 0,false};return m,true}
