import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line as SvgLine } from "react-native-svg";
import { ORANGE, bucketLabel } from "../constants";
import { polarToXY, describeArc } from "../helpers";

const ArcGauge = ({ pct }) => {
  const SIZE = 280;
  const CX = SIZE / 2;
  const CY = SIZE / 2 + 6;   
  const R = 108;               
  const STROKE_W = 14;
  const START_DEG = 180;       
  const END_DEG = 360;         
  const NEEDLE_R = R - 22;    

  const nowBucket = bucketLabel(pct);
  const labelColor = nowBucket.color;
  const statusLabel = nowBucket.label;

  const [needlePt, setNeedlePt] = useState(polarToXY(CX, CY, NEEDLE_R, START_DEG));
  const [fillEnd, setFillEnd] = useState(START_DEG);

  useEffect(() => {
    const targetAngle = START_DEG + (pct / 100) * (END_DEG - START_DEG);
    let start = null;
    const duration = 1400;
    const raf = setInterval(() => {
      if (!start) start = Date.now();
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const curAngle = START_DEG + ease * (targetAngle - START_DEG);
      setNeedlePt(polarToXY(CX, CY, NEEDLE_R, curAngle));
      setFillEnd(curAngle);
      if (t >= 1) clearInterval(raf);
    }, 16);
    return () => clearInterval(raf);
  }, [pct]);

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const TICK_INNER = R - 20;
  const TICK_OUTER = R - 10;

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      <Svg width={SIZE} height={SIZE * 0.58} viewBox={`0 0 ${SIZE} ${SIZE * 0.58}`}>
        <Path
          d={describeArc(CX, CY, R, START_DEG, END_DEG)}
          stroke="#222228"
          strokeWidth={STROKE_W}
          fill="none"
          strokeLinecap="round"
        />

        {fillEnd > START_DEG && (
          <Path
            d={describeArc(CX, CY, R, START_DEG, fillEnd)}
            stroke={labelColor}
            strokeWidth={STROKE_W}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const angle = START_DEG + t * (END_DEG - START_DEG);
          const p1 = polarToXY(CX, CY, TICK_INNER, angle);
          const p2 = polarToXY(CX, CY, TICK_OUTER, angle);
          return (
            <SvgLine
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#444"
              strokeWidth={1.5}
            />
          );
        })}

        <Circle cx={needlePt.x} cy={needlePt.y} r={5} fill={labelColor} />

        <Circle cx={CX} cy={CY} r={5} fill="#333" />
      </Svg>

      <View style={{ position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "900", color: labelColor, letterSpacing: 1 }}>
          {statusLabel}
        </Text>
        <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 }}>
          Right now
        </Text>
      </View>
    </View>
  );
};

export default ArcGauge;
