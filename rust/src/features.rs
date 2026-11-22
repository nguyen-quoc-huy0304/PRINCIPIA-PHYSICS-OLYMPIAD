//! Feature inventory used during the V1-to-new-core migration.
//! Keep this list exhaustive: a migration is not complete while a legacy capability is missing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Feature {
    Authentication, Profiles, LearningCatalog, Lessons, Notes, Documents, EBooks,
    VideoLearning, Transcript, Ocr, Translation, Speech, Quiz, AssignmentSubmission,
    AiGrading, AiAssistant, ChatHistory, VirtualLab, PhysicsSimulation, ChemistrySimulation,
    BiologySimulation, AstronomySimulation, EngineeringSimulation, WhatIfExperiments,
    ExperimentBuilder, DataGraphs, Reports, Progress, ExperiencePoints, Leaderboard,
    CompanionCharacters, Notifications, EmbeddedBrowser, Downloads, DesktopUpdater,
    CrossDeviceSync, Accessibility, ResponsiveMobileUi,
}

pub const MIGRATION_FEATURES: &[Feature] = &[
    Feature::Authentication, Feature::Profiles, Feature::LearningCatalog, Feature::Lessons,
    Feature::Notes, Feature::Documents, Feature::EBooks, Feature::VideoLearning,
    Feature::Transcript, Feature::Ocr, Feature::Translation, Feature::Speech, Feature::Quiz,
    Feature::AssignmentSubmission, Feature::AiGrading, Feature::AiAssistant, Feature::ChatHistory,
    Feature::VirtualLab, Feature::PhysicsSimulation, Feature::ChemistrySimulation,
    Feature::BiologySimulation, Feature::AstronomySimulation, Feature::EngineeringSimulation,
    Feature::WhatIfExperiments, Feature::ExperimentBuilder, Feature::DataGraphs, Feature::Reports,
    Feature::Progress, Feature::ExperiencePoints, Feature::Leaderboard, Feature::CompanionCharacters,
    Feature::Notifications, Feature::EmbeddedBrowser, Feature::Downloads, Feature::DesktopUpdater,
    Feature::CrossDeviceSync, Feature::Accessibility, Feature::ResponsiveMobileUi,
];

pub fn migration_inventory() -> &'static [Feature] { MIGRATION_FEATURES }
