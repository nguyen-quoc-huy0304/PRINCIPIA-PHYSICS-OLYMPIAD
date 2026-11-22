//! Unified Virtual Lab domain model shared by physics, chemistry, biology,
//! astronomy and engineering activities. UI/platform adapters live elsewhere.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Discipline { Physics, Chemistry, Biology, Astronomy, Engineering }

#[derive(Debug, Clone, PartialEq)]
pub struct Parameter {
    pub key: String,
    pub value: f64,
    pub unit: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Sample {
    pub time_seconds: f64,
    pub values: Vec<Parameter>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Experiment {
    pub id: String,
    pub title: String,
    pub discipline: Discipline,
    pub parameters: Vec<Parameter>,
    pub samples: Vec<Sample>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LabError {
    EmptyId, EmptyTitle, EmptyParameterName, NonFiniteValue,
    NegativeTime, TimeMustIncrease, DuplicateParameter,
}

impl Experiment {
    pub fn new(id: impl Into<String>, title: impl Into<String>, discipline: Discipline) -> Result<Self, LabError> {
        let id=id.into(); let title=title.into();
        if id.trim().is_empty() { return Err(LabError::EmptyId); }
        if title.trim().is_empty() { return Err(LabError::EmptyTitle); }
        Ok(Self { id, title, discipline, parameters: Vec::new(), samples: Vec::new() })
    }

    pub fn set_parameter(&mut self, key: impl Into<String>, value: f64, unit: impl Into<String>) -> Result<(), LabError> {
        let key=key.into();
        if key.trim().is_empty() { return Err(LabError::EmptyParameterName); }
        if !value.is_finite() { return Err(LabError::NonFiniteValue); }
        let unit=unit.into();
        if let Some(p)=self.parameters.iter_mut().find(|p| p.key==key) {
            p.value=value; p.unit=unit;
        } else {
            self.parameters.push(Parameter { key, value, unit });
        }
        Ok(())
    }

    pub fn record(&mut self, time_seconds: f64, values: Vec<Parameter>) -> Result<(), LabError> {
        if !time_seconds.is_finite() || values.iter().any(|v| !v.value.is_finite()) {
            return Err(LabError::NonFiniteValue);
        }
        if time_seconds < 0.0 { return Err(LabError::NegativeTime); }
        if self.samples.last().is_some_and(|s| time_seconds <= s.time_seconds) {
            return Err(LabError::TimeMustIncrease);
        }
        if values.iter().any(|v| v.key.trim().is_empty()) { return Err(LabError::EmptyParameterName); }
        let mut seen=std::collections::HashSet::new();
        if values.iter().any(|v| !seen.insert(v.key.as_str())) { return Err(LabError::DuplicateParameter); }
        self.samples.push(Sample { time_seconds, values });
        Ok(())
    }

    /// A What-If scenario is an isolated copy; it never mutates the source experiment.
    pub fn what_if(&self, overrides: &[Parameter]) -> Result<Self, LabError> {
        let mut scenario=self.clone();
        for p in overrides { scenario.set_parameter(p.key.clone(), p.value, p.unit.clone())?; }
        scenario.id=format!("{}-scenario", self.id);
        scenario.title=format!("{} — What If", self.title);
        Ok(scenario)
    }

    pub fn csv(&self) -> String {
        let mut keys: Vec<String>=self.samples.iter().flat_map(|s| s.values.iter().map(|v| v.key.clone())).collect();
        keys.sort(); keys.dedup();
        let mut out=String::from("time_seconds");
        for key in &keys { out.push(','); out.push_str(&csv_escape(key)); }
        out.push('\n');
        for sample in &self.samples {
            out.push_str(&sample.time_seconds.to_string());
            for key in &keys {
                out.push(',');
                if let Some(v)=sample.values.iter().find(|v| &v.key==key) { out.push_str(&v.value.to_string()); }
            }
            out.push('\n');
        }
        out
    }
}
fn csv_escape(s: &str) -> String {
    if s.contains([',','"','\n']) { format!("\"{}\"",s.replace('"',"\"\"")) } else { s.to_string() }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn what_if_does_not_mutate_original() {
        let mut e=Experiment::new("e1","Free fall",Discipline::Physics).unwrap();
        e.set_parameter("g",9.81,"m/s²").unwrap();
        let changed=e.what_if(&[Parameter{key:"g".into(),value:1.62,unit:"m/s²".into()}]).unwrap();
        assert_eq!(e.parameters[0].value,9.81);
        assert_eq!(changed.parameters[0].value,1.62);
    }
    #[test] fn rejects_non_increasing_samples() {
        let mut e=Experiment::new("e2","Test",Discipline::Engineering).unwrap();
        e.record(1.0,vec![]).unwrap();
        assert_eq!(e.record(1.0,vec![]),Err(LabError::TimeMustIncrease));
    }
    #[test] fn exports_samples_to_csv() {
        let mut e=Experiment::new("e3","Test",Discipline::Biology).unwrap();
        e.record(0.0,vec![Parameter{key:"pH".into(),value:7.0,unit:"".into()}]).unwrap();
        assert!(e.csv().contains("time_seconds,pH"));
    }
}
