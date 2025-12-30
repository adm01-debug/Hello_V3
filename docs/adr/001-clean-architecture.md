# ADR-001: Adopt Clean Architecture

Date: 2025-12-30

## Status
Accepted

## Context
The codebase was mixing business logic with infrastructure concerns, making it difficult to test and maintain.

## Decision
Adopt Clean Architecture with clear separation:
- Domain: Entities, Value Objects, Repository Interfaces
- Application: Use Cases, DTOs
- Infrastructure: Database, Cache, External Services
- Presentation: Controllers, Routes, Middleware

## Consequences

### Positive
- Business logic independent of frameworks
- Easier to test (dependency injection)
- Better code organization
- Scalable architecture

### Negative
- More files and folders
- Learning curve for team
- Initial setup time

### Neutral
- Need to refactor existing code
- Requires team training
