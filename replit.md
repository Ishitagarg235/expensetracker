# Expense Tracking Application

## Overview

This is a personal expense tracking web application built with FastAPI backend and vanilla JavaScript frontend. The application allows users to manage their monthly finances by tracking expenses, setting monthly income, and viewing financial summaries. It provides a simple dashboard for monitoring spending patterns and calculating savings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript
- **Design Pattern**: Single-page application with client-side rendering
- **UI Components**: Modular sections for dashboard, income management, and expense tracking
- **Styling**: Custom CSS with responsive design and gradient themes
- **Data Flow**: REST API calls to FastAPI backend with real-time DOM updates

### Backend Architecture
- **Framework**: FastAPI with Pydantic models for data validation
- **API Design**: RESTful endpoints for CRUD operations on expenses and income
- **Data Models**: Structured models for Expense, Income, and their create/update variants
- **Error Handling**: HTTP exceptions for invalid requests
- **Static File Serving**: Integrated static file server for frontend assets

### Data Storage Solution
- **Storage Type**: File-based JSON storage
- **Structure**: Separate JSON files for expenses and income data
- **Location**: Local `data/` directory with automatic initialization
- **Data Format**: 
  - Expenses: Array of expense objects with UUID identifiers
  - Income: Single object with monthly amount and period

### Authentication and Authorization
- **Current State**: No authentication implemented
- **Security Model**: Open access to all endpoints
- **Consideration**: Designed for single-user personal finance tracking

## External Dependencies

### Backend Dependencies
- **FastAPI**: Modern web framework for building APIs
- **Pydantic**: Data validation and settings management using Python type annotations
- **Uvicorn**: ASGI server for running FastAPI applications (implied)

### Frontend Dependencies
- **None**: Uses vanilla JavaScript and CSS without external libraries
- **Browser APIs**: Relies on modern browser features for DOM manipulation and fetch API

### Data Dependencies
- **File System**: Direct file I/O operations for JSON data persistence
- **JSON**: Native Python JSON module for data serialization

### Development Environment
- **Replit Platform**: Configured for cloud-based development and deployment
- **Static Assets**: Self-contained CSS and JavaScript files served via FastAPI

Note: The application currently uses file-based storage but is structured in a way that could easily accommodate database integration in the future.