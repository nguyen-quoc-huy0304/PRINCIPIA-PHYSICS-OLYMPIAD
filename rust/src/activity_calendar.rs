//! Calendar activity and study-streak calculations owned by Rust.
use serde_json::{json, Value};
use std::collections::BTreeSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CalendarError { InvalidDate, InvalidPayload }

fn parse_day(value: &str) -> Result<i64, CalendarError> {
    let bytes=value.as_bytes();
    if bytes.len()!=10 || bytes[4]!=b'-' || bytes[7]!=b'-'
        || !bytes.iter().enumerate().all(|(i,b)| matches!(i,4|7)||b.is_ascii_digit()) {
        return Err(CalendarError::InvalidDate);
    }
    let year=value[0..4].parse::<i64>().map_err(|_|CalendarError::InvalidDate)?;
    let month=value[5..7].parse::<i64>().map_err(|_|CalendarError::InvalidDate)?;
    let day=value[8..10].parse::<i64>().map_err(|_|CalendarError::InvalidDate)?;
    if !(1..=12).contains(&month) { return Err(CalendarError::InvalidDate); }
    let leap=year%4==0 && (year%100!=0 || year%400==0);
    let max=match month {1|3|5|7|8|10|12=>31,4|6|9|11=>30,2=>if leap{29}else{28},_=>return Err(CalendarError::InvalidDate)};
    if day<1 || day>max { return Err(CalendarError::InvalidDate); }
    let y=year-i64::from(month<=2);
    let era=(if y>=0 {y} else {y-399})/400;
    let yoe=y-era*400;
    let mp=month+if month>2 {-3}else{9};
    let doy=(153*mp+2)/5+day-1;
    Ok(era*146097+yoe*365+yoe/4-yoe/100+doy)
}

fn format_day(ordinal:i64)->String {
    let era=(if ordinal>=0 {ordinal} else {ordinal-146096})/146097;
    let doe=ordinal-era*146097;
    let yoe=(doe-doe/1460+doe/36524-doe/146096)/365;
    let mut year=yoe+era*400;
    let doy=doe-(365*yoe+yoe/4-yoe/100);
    let mp=(5*doy+2)/153;
    let day=doy-(153*mp+2)/5+1;
    let month=mp+if mp<10 {3}else{-9};
    year+=i64::from(month<=2);
    format!("{year:04}-{month:02}-{day:02}")
}

fn longest(sorted:&BTreeSet<i64>)->u64 {
    let(mut best,mut run,mut previous)=(0_u64,0_u64,None);
    for day in sorted {
        run=if previous==Some(*day-1){run.saturating_add(1)}else{1};
        best=best.max(run);
        previous=Some(*day);
    }
    best
}

pub fn activity_summary(days:&[String], today:&str, record_today:bool)->Result<Value,CalendarError>{
    let today_ordinal=parse_day(today)?;
    if days.len()>10_000 {return Err(CalendarError::InvalidPayload);}
    let mut valid=BTreeSet::new();
    for day in days {
        let value=parse_day(day).map_err(|_|CalendarError::InvalidPayload)?;
        valid.insert(value);
    }
    if record_today {valid.insert(today_ordinal);}
    let active_today=valid.contains(&today_ordinal);
    let start=if active_today{today_ordinal}else{today_ordinal-1};
    let mut current=0_u64;
    let mut cursor=start;
    while valid.contains(&cursor){current+=1;cursor-=1;}
    let longest_streak=longest(&valid).max(current);
    let normalized=valid.iter().map(|day|format_day(*day)).collect::<Vec<_>>();
    Ok(json!({
        "days":normalized,
        "current":current,
        "longest":longest_streak,
        "activeToday":active_today
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_leap_days_and_rejects_impossible_dates(){
        assert!(parse_day("2024-02-29").is_ok());
        for date in ["2026-02-29","2026-04-31","2026-13-01","2026-1-01","2026/01/01"] {
            assert_eq!(parse_day(date),Err(CalendarError::InvalidDate));
        }
    }

    #[test]
    fn computes_current_and_longest_streak_without_mutating_input(){
        let days=vec!["2026-11-20".into(),"2026-11-21".into(),"2026-11-23".into(),"2026-11-24".into()];
        let result=activity_summary(&days,"2026-11-25",false).unwrap();
        assert_eq!(result["current"],2);
        assert_eq!(result["longest"],2);
        assert_eq!(result["activeToday"],false);
        assert_eq!(days.len(),4);
    }

    #[test]
    fn records_today_and_normalizes_duplicates(){
        let days=vec!["2026-11-25".into(),"2026-11-25".into(),"bad".into()];
        let result=activity_summary(&days,"2026-11-26",true).unwrap();
        assert_eq!(result["days"].as_array().unwrap().len(),2);
        assert_eq!(result["current"],2);
        assert_eq!(result["activeToday"],true);
    }

    #[test]
    fn handles_empty_and_stale_activity(){
        let result=activity_summary(&["2026-11-01".into()],"2026-11-26",false).unwrap();
        assert_eq!(result["current"],0);
        assert_eq!(result["longest"],1);
    }

    #[test]
    fn rejects_invalid_activity_days_instead_of_silently_skipping(){
        for invalid in ["", "not-a-date", "2026-02-30", "2026-11-1"] {
            assert_eq!(
                activity_summary(&[invalid.into()], "2026-11-26", false),
                Err(CalendarError::InvalidPayload),
                "invalid date must fail: {invalid}"
            );
        }
    }
}
