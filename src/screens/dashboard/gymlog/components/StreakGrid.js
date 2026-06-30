import { useRef, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { minuteColor } from "../helpers";

const StreakGrid = ({ data }) => {
  const CELL = 12;
  const GAP = 3;
  const WEEKS = 52;
  const COL_W = CELL + GAP; 
  const DAY_LABEL_W = 28; 
  const MIN_LABEL_GAP_WEEKS = 3;

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(data.slice(w * 7, w * 7 + 7));
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const monthLabels = [];
  let lastMonth = "";
  let lastLabelWeek = -Infinity;
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d);
    if (firstDay) {
      const month = new Date(firstDay.date).toLocaleString("en-US", { month: "short" });
      if (month !== lastMonth) {
        if (wi - lastLabelWeek >= MIN_LABEL_GAP_WEEKS) {
          monthLabels.push({ week: wi, label: month });
          lastLabelWeek = wi;
        }
        lastMonth = month;
      }
    }
  });

  const monthScrollRef = useRef(null);
  const gridScrollRef = useRef(null);

  const handleGridScroll = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    monthScrollRef.current?.scrollTo({ x, animated: false });
  }, []);

  const totalGridW = WEEKS * COL_W;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: DAY_LABEL_W }} />

        <ScrollView
          ref={monthScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          pointerEvents="none"
        >
          <View style={{ width: totalGridW, height: 16, position: "relative" }}>
            {monthLabels.map(({ week, label }) => (
              <Text
                key={`${week}-${label}`}
                style={{
                  position: "absolute",
                  left: week * COL_W,
                  top: 0,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: "600",
                }}
              >
                {label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row" }}>
        {/* Day labels */}
        <View style={{ width: DAY_LABEL_W, justifyContent: "space-around" }}>
          {dayLabels.map((d, i) => (
            <Text
              key={i}
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.25)",
                height: CELL + GAP,
                lineHeight: CELL + GAP,
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        <ScrollView
          ref={gridScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleGridScroll}
          scrollEventThrottle={16}
        >
          <View style={{ flexDirection: "row", gap: GAP }}>
            {weeks.map((week, wi) => (
              <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => (
                  <View
                    key={di}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2.5,
                      backgroundColor: minuteColor(day?.minutes || 0),
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Less</Text>
        {["rgba(255,255,255,0.05)", "rgba(251,146,60,0.25)", "rgba(249,115,22,0.55)", "rgba(234,88,12,0.78)", "#C2410C"].map((c, i) => (
          <View key={i} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: c }} />
        ))}
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>More</Text>
      </View>
    </View>
  );
};

export default StreakGrid;
