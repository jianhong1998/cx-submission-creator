# 001 - Project Overview

## Project Description

**CX Submission Creator** is a Model Context Protocol (MCP) server that enables AI agents to interact with customer experience systems through specialized tools. The project focuses on user authentication and management workflows within a customer experience ecosystem.

## Business Context

- **Primary Purpose**: Enable AI agents to authenticate as users and perform customer experience operations
- **Target Users**: AI/ML Engineers building customer service automation
- **Key Workflows**: User discovery → Authentication → Customer experience operations
- **Integration Pattern**: External service integration through modular architecture

## Project Goals

The project implements a two-phase user management workflow for AI agents:

1. **Discovery Phase**: Use `list_users` to discover available users
2. **Authentication Phase**: Use `login_as_user` to authenticate as a specific user

This enables AI agents to operate within customer experience systems with proper user context and permissions.