# Agent Handoff Prompt for Somatic Alignment Guide Enhancement

## Context

I have a fully functional universal app (React Native + Next.js monorepo) called "Somatic Alignment Guide" that helps users correct Anterior Pelvic Tilt through guided routines and AI chat. The app is working perfectly on both web and native iOS.

## Current State

- ✅ Monorepo setup with Turborepo + Yarn workspaces
- ✅ Expo SDK 54 for native iOS
- ✅ Next.js 15 for web
- ✅ Tamagui for cross-platform UI
- ✅ Zustand for state management with persistence
- ✅ Google Gemini AI integration via Next.js API
- ✅ 4 shared screens: Dashboard, Routines, Knowledge Vault, AI Guide
- ✅ All code in packages/app/ (single source of truth)
- ✅ TypeScript, React 19.1.0
- ✅ Working on iPhone via Expo Go
- ✅ Working on web at localhost:3000

## Your Mission

Please read and meticulously implement the enhancements outlined in `ENHANCEMENT-ROADMAP.md`. Work through the improvements systematically with **maximum scrutiny and fidelity**.

## Critical Requirements

### 1. **Code Quality & Standards**

- Maintain the existing architecture: all shared code in `packages/app/`
- Follow existing patterns (Zustand for state, Tamagui components, TypeScript strict)
- Use full Tamagui property names (not shorthand): `padding` not `p`, `flex` not `f`
- Ensure type safety throughout
- No runtime errors or warnings

### 2. **Configuration Management**

- **Double-check ALL related configurations** when making changes
- If you modify `packages/app/`, check both `apps/expo/` and `apps/next/` usage
- Update TypeScript configs if adding new file types or directories
- Update package.json dependencies in the correct workspace
- Maintain monorepo workspace structure integrity

### 3. **Cross-Platform Compatibility**

- **Every change MUST work on both Expo (native) and Next.js (web)**
- Test platform-specific APIs (use conditional imports when needed)
- Ensure Tamagui components render correctly on both platforms
- Handle web vs native differences gracefully (e.g., audio, haptics, camera)

### 4. **Testing Protocol**

For **every feature** you implement:

a) **Build Test**: Run `yarn build` from root - must succeed
b) **Type Check**: Verify no new TypeScript errors (existing React 19 warnings are OK)
c) **Native Test**:

- Start Expo: `cd apps/expo && npx expo start`
- Verify feature works on iPhone via Expo Go
- Check for runtime errors in Metro bundler logs
  d) **Web Test**:
- Start Next.js: `cd apps/next && yarn dev`
- Verify feature works at http://localhost:3000
- Check browser console for errors
  e) **End-to-End Test**:
- Complete user flow from start to finish
- Verify state persistence (close/reopen app)
- Test edge cases (empty state, network errors, etc.)

### 5. **Dependency Management**

- Install packages in the **correct workspace**:
  - Shared logic: `packages/app/package.json`
  - Native-only: `apps/expo/package.json`
  - Web-only: `apps/next/package.json`
- Run `yarn install` from **root** after adding dependencies
- Rebuild packages: `yarn build` from root
- Check for peer dependency conflicts

### 6. **Implementation Approach**

**For each enhancement:**

1. **Read & Plan**
   - Read the enhancement description completely
   - Identify all files that need changes
   - List all configurations that might be affected
   - Plan the implementation steps

2. **Implement Incrementally**
   - Make one logical change at a time
   - Don't batch multiple features in one edit
   - Test after each significant change
   - Fix errors immediately before proceeding

3. **Update Related Files**
   - If you add a new type, update `packages/app/types.ts`
   - If you add store state, update `packages/app/lib/store.ts`
   - If you add content, update `packages/app/lib/content.ts`
   - If you add a feature to a screen, ensure both native and web screens use it

4. **Verify Configurations**
   - Check `tsconfig.json` files if adding new directories
   - Check `package.json` if adding new dependencies
   - Check `next.config.js` if adding webpack loaders
   - Check `metro.config.js` if excluding new file patterns
   - Check `app.json` if adding new native features

5. **Documentation**
   - Update README.md with new features
   - Document new environment variables
   - Add inline code comments for complex logic
   - Update SETUP-GUIDE.md if setup steps change

### 7. **Error Handling**

When you encounter errors:

a) **Read the full error message** - don't guess
b) **Check related configurations** - often it's a config issue
c) **Verify imports** - ensure paths and module names are correct
d) **Check platform compatibility** - some APIs are platform-specific
e) **Install missing dependencies** - run `yarn install` from root
f) **Rebuild packages** - run `yarn build` from root
g) **Clear caches** if needed:

```bash
# Expo
cd apps/expo && npx expo start --clear

# Next.js
cd apps/next && rm -rf .next && yarn dev
```

### 8. **Known Constraints**

- **TypeScript errors**: React 19 + Tamagui type incompatibility errors exist but don't affect runtime - ignore them
- **Expo SDK 54**: Project uses this version - don't upgrade without asking
- **React 19.1.0**: Locked via resolutions - don't change
- **Environment variables**:
  - Next.js API key in `apps/next/.env`
  - Expo API URL in `apps/expo/.env` (use local IP, not localhost)
- **Bundle identifier**: `com.drof.somaticalignment`
- **Owner**: `dRof`

### 9. **Implementation Priority**

Work through enhancements in this order (from ENHANCEMENT-ROADMAP.md):

**Phase 1: AI Enhancements**

1. Conversational Memory & Context Awareness
2. Intelligent Routine Recommendations
3. Voice Input/Output (if time permits)

**Phase 2: Interactive RoutinePlayer**

1. Interactive Exercise Feedback (timers, breath pacing)
2. Form Checklist
3. Haptic Feedback
4. Ambient Soundscapes

**Phase 3: Data & Insights**

1. Post-Routine Journaling
2. Achievement System
3. Progress Dashboard

**Phase 4: UI/UX Polish**

1. Micro-interactions & Animations
2. Celebration effects

### 10. **Quality Checklist**

Before marking any feature "complete", verify:

- [ ] Code compiles with no new TypeScript errors
- [ ] Feature works on Expo (native iOS)
- [ ] Feature works on Next.js (web)
- [ ] No runtime errors in console/logs
- [ ] State persists across app restarts
- [ ] All related configurations updated
- [ ] All touching files updated appropriately
- [ ] Cross-platform differences handled
- [ ] Edge cases tested (empty state, errors, etc.)
- [ ] User experience is smooth and polished
- [ ] Documentation updated if needed

### 11. **Communication Guidelines**

- **Before starting each feature**: Confirm you understand the requirements
- **After implementing**: Show what you changed and what to test
- **If uncertain**: Ask for clarification rather than guessing
- **When encountering issues**: Explain the problem and proposed solutions
- **When complete**: Provide testing instructions for the user

## Example Workflow

Here's how to approach the first enhancement (AI Memory):

1. **Read**: Understand that we need to add chat history to Zustand store
2. **Plan**:
   - Modify `packages/app/lib/store.ts` to add ChatHistory interface
   - Modify `apps/expo/app/(tabs)/guide.tsx` to save messages to store
   - Modify `apps/next/app/(tabs)/guide/page.tsx` to save messages to store
   - Modify `apps/next/app/api/chat/route.ts` to include context in prompt
3. **Implement**:
   - Add types to `packages/app/types.ts`
   - Update store with chat history methods
   - Update guide screens to use store
   - Update API to build contextual prompts
4. **Test**:
   - Build packages
   - Test on Expo: Ask AI a question, close app, reopen, verify history
   - Test on Next.js: Same flow
   - Verify AI references previous conversation
5. **Verify**:
   - Check all related files updated
   - No console errors
   - State persists
   - Works on both platforms

## Starting Command

Begin by:

1. Reading `ENHANCEMENT-ROADMAP.md` completely
2. Confirming you understand the architecture
3. Asking any clarifying questions
4. Starting with Phase 1, Enhancement 1.1 (AI Memory)

## Important Reminders

- **Never skip testing** - test every change on both platforms
- **Never assume** - double-check all configurations
- **Never rush** - quality over speed
- **Always verify end-to-end** - complete user flows must work
- **Install packages meticulously** - wrong workspace placement causes issues
- **Rebuild when needed** - packages must be built after changes

---

Please confirm you understand these requirements and are ready to begin systematic implementation of the enhancement roadmap with maximum scrutiny and fidelity.
