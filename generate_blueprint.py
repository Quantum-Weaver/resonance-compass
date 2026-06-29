"""
generate_blueprint.py — Resonance Compass Blueprint Generator
Drop in project root. Run. Produces complete project awareness for Claude.

Usage: python generate_blueprint.py
Output: docs/blueprints/ (complete hierarchy)
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime

# ─── CONFIGURATION ───

PROJECT_ROOT = Path(__file__).parent
SRC = PROJECT_ROOT / "src"
SRC_TAURI = PROJECT_ROOT / "src-tauri" / "src"
BLUEPRINTS = PROJECT_ROOT / "docs" / "blueprints"
BUILD_SEQUENCE = PROJECT_ROOT / "docs" / "BUILD-SEQUENCE.md"

# ─── FILE SCANNERS ───

def scan_svelte_file(path: Path) -> dict:
    """Extract structure from a Svelte file."""
    content = path.read_text(encoding='utf-8')

    # Extract script block
    script_match = re.search(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
    script = script_match.group(1) if script_match else ""

    # Extract template (everything not in script or style)
    template = content
    if script_match:
        template = template.replace(script_match.group(0), '')
    style_match = re.search(r'<style[^>]*>(.*?)</style>', template, re.DOTALL)
    if style_match:
        template = template.replace(style_match.group(0), '')

    # Extract style
    style = style_match.group(1) if style_match else ""

    # Parse imports
    imports = {
        'components': re.findall(r"from\s+'\$lib/components/(\w+)'", script),
        'stores': re.findall(r"from\s+'\$lib/stores/(\w+)'", script),
        'types': re.findall(r"from\s+'\$lib/types/(\w+)'", script),
        'navigation': re.findall(r"from\s+'\$app/navigation'", script),
        'data': re.findall(r"from\s+'\$lib/data/(\w+)'", script),
        'cosmic': re.findall(r"from\s+'\$lib/cosmic'", script),
        'theme': re.findall(r"from\s+'\$lib/theme/(\w+)'", script),
    }

    # Parse reactive state
    reactive = []
    for match in re.finditer(r'(?:let|const)\s+(\w+)\s*=\s*\$(\w+)\((.*?)\)', script):
        reactive.append({
            'name': match.group(1),
            'rune': f'${match.group(2)}',
            'source': match.group(3).strip()
        })

    # Parse functions
    functions = []
    for match in re.finditer(r'(?:async\s+)?function\s+(\w+)\s*\((.*?)\)', script):
        functions.append({
            'name': match.group(1),
            'params': match.group(2)
        })

    # Parse goto navigation
    goto_calls = re.findall(r"goto\(['\"]([^'\"]+)['\"]", script)

    # Parse CSS classes used in template
    css_classes = re.findall(r'class[:\w]*="([^"]*)"', template)
    css_classes = list(set(' '.join(css_classes).split()))

    # Detect Svelte 5 rune usage
    uses_state = '$state' in script
    uses_derived = '$derived' in script
    uses_effect = '$effect' in script

    # Detect z-index values
    z_indices = re.findall(r'z-index:\s*(\d+)', style)

    return {
        'imports': imports,
        'reactive_state': reactive,
        'functions': functions,
        'goto_navigation': goto_calls,
        'css_classes': css_classes,
        'has_style_block': bool(style),
        'script_lines': len(script.split('\n')) if script else 0,
        'template_lines': len(template.split('\n')),
        'uses_runes': {'state': uses_state, 'derived': uses_derived, 'effect': uses_effect},
        'z_indices': z_indices,
        'has_ondestroy': 'onDestroy' in script or 'return () =>' in script,
    }


def scan_rust_file(path: Path) -> dict:
    """Extract structure from a Rust file."""
    content = path.read_text(encoding='utf-8')

    # Extract full command signatures
    command_sigs = []
    for match in re.finditer(
        r'#\[tauri::command\]\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)',
        content, re.DOTALL
    ):
        params_raw = re.sub(r'\s+', ' ', match.group(2)).strip()
        command_sigs.append({'name': match.group(1), 'params': params_raw})

    # Extract migrations
    migrations = []
    for match in re.finditer(r'Migration\s*\{[^}]*version:\s*(\d+)', content, re.DOTALL):
        migrations.append(int(match.group(1)))

    # Extract registered plugins
    plugins = re.findall(r'tauri_plugin_(\w+)', content)

    return {
        'commands': [c['name'] for c in command_sigs],
        'command_signatures': command_sigs,
        'structs': re.findall(r'(?:pub\s+)?struct\s+(\w+)', content),
        'imports': re.findall(r'use\s+([\w:]+)', content),
        'mod_declarations': re.findall(r'(?:pub\s+)?mod\s+(\w+)', content),
        'migrations': migrations,
        'plugins': list(set(plugins)),
        'lines': len(content.split('\n')),
    }


def scan_typescript_file(path: Path) -> dict:
    """Extract interfaces and types from a TypeScript file."""
    content = path.read_text(encoding='utf-8')

    return {
        'interfaces': re.findall(r'export\s+interface\s+(\w+)', content),
        'types': re.findall(r'export\s+type\s+(\w+)', content),
        'enums': re.findall(r'export\s+enum\s+(\w+)', content),
    }


# ─── AGENT 1: ROUTE SCANNER ───

def scan_routes():
    """Scan all route folders and produce route blueprints."""
    routes_dir = SRC / "routes"
    output_dir = BLUEPRINTS / "routes"
    output_dir.mkdir(parents=True, exist_ok=True)

    route_blueprints = []

    for svelte_file in routes_dir.rglob("+page.svelte"):
        rel_path = svelte_file.relative_to(routes_dir)
        route_name = str(rel_path.parent).replace('\\', '_').replace('[', '').replace(']', '')
        if route_name == '.':
            route_name = 'home'

        analysis = scan_svelte_file(svelte_file)

        blueprint = {
            'route_name': route_name,
            'source_file': str(svelte_file.relative_to(PROJECT_ROOT)),
            'scan_timestamp': sacred_timestamp(),
            'analysis': analysis,
            'phase': detect_phase(route_name),
            'status': 'complete'
        }

        bp_path = output_dir / f"fbp_{route_name}.ai.json"
        bp_path.write_text(json.dumps(blueprint, indent=2))
        route_blueprints.append(blueprint)
        print(f"  [route] {bp_path.name}")

    # Also write combined routes layer blueprint
    routes_layer = {
        'layer': 'routes',
        'routes': {rb['route_name']: {
            'file': rb['source_file'],
            'phase': rb['phase'],
            'navigates_to': rb['analysis']['goto_navigation'],
            'imports_stores': rb['analysis']['imports']['stores'],
            'imports_components': rb['analysis']['imports']['components'],
        } for rb in route_blueprints},
        'total_routes': len(route_blueprints),
        'scan_timestamp': sacred_timestamp(),
    }
    routes_bp_path = BLUEPRINTS / "layers" / "obp_routes.ai.json"
    routes_bp_path.parent.mkdir(parents=True, exist_ok=True)
    routes_bp_path.write_text(json.dumps(routes_layer, indent=2))
    print(f"  [layer] obp_routes.ai.json")

    return route_blueprints


# ─── AGENT 2: LAYER INTEGRATOR ───

def integrate_stores():
    """Analyze all store files and produce store layer blueprint."""
    stores_dir = SRC / "lib" / "stores"
    output_dir = BLUEPRINTS / "layers"
    output_dir.mkdir(parents=True, exist_ok=True)

    stores = {}

    for store_file in stores_dir.glob("*.ts"):
        content = store_file.read_text(encoding='utf-8')
        store_name = store_file.stem.replace('.svelte', '')

        # Detect init/load functions
        has_init = bool(re.search(r'(?:async\s+)?function\s+init\w*\s*\(', content) or
                        re.search(r'init\w*\s*\(', content))
        has_load = bool(re.search(r'(?:async\s+)?function\s+load\w*\s*\(', content) or
                        re.search(r'load\w*\s*\(', content))

        stores[store_name] = {
            'file': str(store_file.relative_to(PROJECT_ROOT)),
            'lines': len(content.split('\n')),
            'reactive_state': re.findall(r'let\s+(\w+)\s*=\s*\$state', content),
            'exports': re.findall(r'(?:async\s+)?function\s+(\w+)', content),
            'tauri_invoke_calls': re.findall(r"invoke\(['\"](\w+)['\"]", content),
            'events_listened': re.findall(r"listen\(['\"]([^'\"]+)['\"]", content),
            'localStorage_keys': re.findall(r"localStorage\.(?:get|set)Item\(['\"]([^'\"]+)['\"]", content),
            'has_init_function': has_init,
            'has_load_function': has_load,
        }

    blueprint = {
        'layer': 'stores',
        'stores': stores,
        'cross_dependencies': detect_cross_dependencies(stores),
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "obp_stores.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [layer] {bp_path.name}")
    return blueprint


def integrate_components():
    """Analyze all component files and produce component layer blueprint."""
    components_dir = SRC / "lib" / "components"
    output_dir = BLUEPRINTS / "layers"
    output_dir.mkdir(parents=True, exist_ok=True)

    components = {}

    # Walk all .svelte files (including subdirectories like icons/)
    for comp_file in components_dir.rglob("*.svelte"):
        analysis = scan_svelte_file(comp_file)
        # Use relative path from components dir as key
        rel = comp_file.relative_to(components_dir)
        comp_name = str(rel).replace('\\', '/').replace('.svelte', '')

        # Detect props
        content = comp_file.read_text(encoding='utf-8')
        props = re.findall(r'let\s+\{\s*([\w,\s=?:]+)\}', content)

        # Detect where it's imported
        imported_by = []
        for svelte_file in SRC.rglob("*.svelte"):
            if svelte_file != comp_file:
                file_content = svelte_file.read_text(encoding='utf-8')
                if comp_file.stem in file_content:
                    imported_by.append(str(svelte_file.relative_to(PROJECT_ROOT)))

        components[comp_name] = {
            'file': str(comp_file.relative_to(PROJECT_ROOT)),
            'props': props,
            'lines': len(content.split('\n')),
            'uses_runes': analysis['uses_runes'],
            'z_indices': analysis['z_indices'],
            'has_cleanup': analysis['has_ondestroy'],
            'imported_by': imported_by[:10],
        }

    blueprint = {
        'layer': 'components',
        'components': components,
        'total_components': len(components),
        'icon_components': [k for k in components if k.startswith('icons/')],
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "obp_components.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [layer] {bp_path.name} — {len(components)} components ({len(blueprint['icon_components'])} icons)")
    return blueprint


def integrate_rust_backend():
    """Analyze all Rust source files and produce backend layer blueprint."""
    output_dir = BLUEPRINTS / "layers"
    output_dir.mkdir(parents=True, exist_ok=True)

    rust_files = {}
    all_commands = []
    all_migrations = []
    all_plugins = []

    for rs_file in SRC_TAURI.glob("*.rs"):
        analysis = scan_rust_file(rs_file)
        rust_files[rs_file.stem] = {
            'file': str(rs_file.relative_to(PROJECT_ROOT)),
            'lines': analysis['lines'],
            'commands': analysis['commands'],
            'command_signatures': analysis['command_signatures'],
            'structs': analysis['structs'],
            'imports': analysis['imports'],
            'mod_declarations': analysis['mod_declarations'],
            'migrations': analysis['migrations'],
            'plugins': analysis['plugins'],
        }
        all_commands.extend(analysis['commands'])
        all_migrations.extend(analysis['migrations'])
        all_plugins.extend(analysis['plugins'])

    blueprint = {
        'layer': 'rust_backend',
        'files': rust_files,
        'all_commands': sorted(set(all_commands)),
        'total_commands': len(set(all_commands)),
        'db_migrations': sorted(set(all_migrations)),
        'registered_plugins': sorted(set(all_plugins)),
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "obp_rust_backend.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [layer] {bp_path.name} — {len(set(all_commands))} commands, {len(set(all_migrations))} migrations")
    return blueprint


def integrate_types():
    """Analyze all TypeScript type files and produce types layer blueprint."""
    types_file = SRC / "lib" / "types" / "types.ts"
    output_dir = BLUEPRINTS / "layers"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not types_file.exists():
        print("  [warn] types.ts not found")
        return None

    content = types_file.read_text(encoding='utf-8')

    # Extract interfaces with their full definitions
    interfaces = {}
    current_interface = None
    current_body = []

    for line in content.split('\n'):
        interface_match = re.match(r'export interface (\w+)', line)
        type_match = re.match(r'export type (\w+)', line)
        enum_match = re.match(r'export enum (\w+)', line)

        if interface_match:
            if current_interface:
                interfaces[current_interface] = '\n'.join(current_body)
            current_interface = interface_match.group(1)
            current_body = [line]
        elif type_match:
            if current_interface:
                interfaces[current_interface] = '\n'.join(current_body)
            current_interface = type_match.group(1)
            current_body = [line]
        elif enum_match:
            if current_interface:
                interfaces[current_interface] = '\n'.join(current_body)
            current_interface = enum_match.group(1)
            current_body = [line]
        elif current_interface:
            current_body.append(line)

    if current_interface:
        interfaces[current_interface] = '\n'.join(current_body)

    # Detect which interfaces are imported by other files
    usage = {}
    for ts_file in SRC.rglob("*.ts"):
        if ts_file != types_file:
            file_content = ts_file.read_text(encoding='utf-8')
            for interface_name in interfaces:
                if interface_name in file_content:
                    if interface_name not in usage:
                        usage[interface_name] = []
                    usage[interface_name].append(str(ts_file.relative_to(PROJECT_ROOT)))

    for svelte_file in SRC.rglob("*.svelte"):
        file_content = svelte_file.read_text(encoding='utf-8')
        for interface_name in interfaces:
            if interface_name in file_content:
                if interface_name not in usage:
                    usage[interface_name] = []
                usage[interface_name].append(str(svelte_file.relative_to(PROJECT_ROOT)))

    # Detect duplicates (same name stripped of non-alpha)
    duplicates = []
    interface_keys = list(interfaces.keys())
    for i, name1 in enumerate(interface_keys):
        for name2 in interface_keys[i+1:]:
            if name1.lower().replace('_', '') == name2.lower().replace('_', ''):
                duplicates.append(f"{name1} / {name2}")

    blueprint = {
        'layer': 'types',
        'file': str(types_file.relative_to(PROJECT_ROOT)),
        'interfaces': list(interfaces.keys()),
        'types': [k for k in interfaces if re.match(r'export type', interfaces[k].split('\n')[0])],
        'enums': [k for k in interfaces if re.match(r'export enum', interfaces[k].split('\n')[0])],
        'usage': usage,
        'unused': [k for k in interfaces if k not in usage],
        'duplicates_found': duplicates,
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "obp_types.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [layer] {bp_path.name} — {len(interfaces)} interfaces, {len(blueprint['unused'])} unused")
    return blueprint


def integrate_styles():
    """Analyze all CSS files and produce styles layer blueprint."""
    styles_dir = SRC / "lib" / "styles"
    output_dir = BLUEPRINTS / "layers"
    output_dir.mkdir(parents=True, exist_ok=True)

    css_files = {}
    total_classes = 0

    # Scan generated CSS files
    generated_dir = styles_dir / "generated"
    if generated_dir.exists():
        for css_file in generated_dir.glob("*.css"):
            content = css_file.read_text(encoding='utf-8')
            classes = re.findall(r'\.([\w-]+)\s*\{', content)
            animations = re.findall(r'@keyframes\s+([\w-]+)', content)
            variables = re.findall(r'--([\w-]+)\s*:', content)

            css_files[css_file.name] = {
                'path': str(css_file.relative_to(PROJECT_ROOT)),
                'lines': len(content.split('\n')),
                'classes_defined': len(classes),
                'class_names': classes[:30],
                'animations': animations,
                'custom_properties': list(set(variables))[:30],
                'imported_by_app_css': False,
            }
            total_classes += len(classes)

    # Scan app.css and mark which generated files it imports
    app_css = PROJECT_ROOT / "src" / "app.css"
    if app_css.exists():
        content = app_css.read_text(encoding='utf-8')
        imports = re.findall(r"@import\s+['\"]([^'\"]+)['\"]", content)
        css_files['app.css'] = {
            'path': 'src/app.css',
            'lines': len(content.split('\n')),
            'imports': imports,
            'is_entry_point': True
        }
        # Mark which generated files are imported
        for imp in imports:
            fname = Path(imp).name
            if fname in css_files:
                css_files[fname]['imported_by_app_css'] = True

    # Check which CSS classes are actually used in Svelte files
    all_classes_defined = []
    for fname, fdata in css_files.items():
        if 'class_names' in fdata:
            all_classes_defined.extend(fdata['class_names'])

    used_classes = set()
    for svelte_file in SRC.rglob("*.svelte"):
        content = svelte_file.read_text(encoding='utf-8')
        for cls in all_classes_defined:
            if cls in content:
                used_classes.add(cls)

    unused_classes = [c for c in all_classes_defined if c not in used_classes]

    # Known issues
    known_issues = {
        'typography.css': 'Invalid font-size values (Tailwind class strings used in CSS properties) — not imported in app.css, no runtime impact',
        'domains.css': 'Broken box-shadow syntax — not imported in app.css, no runtime impact',
        'zoom.css': 'Targets 30+ Sanctuary environments irrelevant to desktop player — not imported in app.css, no runtime impact'
    }

    blueprint = {
        'layer': 'styles',
        'files': css_files,
        'total_classes_defined': total_classes,
        'classes_used_in_code': len(used_classes),
        'unused_classes_count': len(unused_classes),
        'unused_class_names': unused_classes[:50],
        'known_issues': known_issues,
        'not_imported_files': [k for k, v in css_files.items() if k != 'app.css' and not v.get('imported_by_app_css', False)],
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "obp_styles.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [layer] {bp_path.name} — {len(css_files)} files, {total_classes} classes, {len(unused_classes)} unused")
    return blueprint


# ─── AGENT 3: STACK SYNTHESIZER ───

def synthesize_frontend(route_blueprints, store_blueprint, component_blueprint):
    """Synthesize the complete frontend architecture blueprint."""
    output_dir = BLUEPRINTS

    # Build route map
    route_map = {}
    for rb in route_blueprints:
        route_map[rb['route_name']] = {
            'file': rb['source_file'],
            'phase': rb['phase'],
            'status': rb['status'],
            'navigates_to': rb['analysis']['goto_navigation']
        }

    # Detect known bugs from CHECKLIST
    known_bugs = []
    checklist_path = PROJECT_ROOT / "docs" / "CHECKLIST.md"
    if checklist_path.exists():
        content = checklist_path.read_text(encoding='utf-8')
        bug_section = re.search(r'## KNOWN BUGS(.*?)(?=##|\Z)', content, re.DOTALL)
        if bug_section:
            for line in bug_section.group(1).strip().split('\n'):
                if line.startswith('|') and 'Description' not in line and '---' not in line:
                    known_bugs.append(line.strip())

    blueprint = {
        'stack': 'frontend',
        'route_map': route_map,
        'total_routes': len(route_map),
        'store_count': len(store_blueprint.get('stores', {})),
        'store_dependencies': store_blueprint.get('cross_dependencies', {}),
        'component_count': component_blueprint.get('total_components', 0),
        'icon_component_count': len(component_blueprint.get('icon_components', [])),
        'known_bugs': known_bugs,
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "dbp_frontend.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [stack] {bp_path.name}")
    return blueprint


def synthesize_backend(rust_blueprint):
    """Synthesize the complete backend architecture blueprint."""
    output_dir = BLUEPRINTS

    blueprint = {
        'stack': 'backend',
        'language': 'Rust',
        'framework': 'Tauri v2',
        'all_commands': rust_blueprint.get('all_commands', []),
        'total_commands': rust_blueprint.get('total_commands', 0),
        'db_migrations': rust_blueprint.get('db_migrations', []),
        'registered_plugins': rust_blueprint.get('registered_plugins', []),
        'files': list(rust_blueprint.get('files', {}).keys()),
        'scan_timestamp': sacred_timestamp()
    }

    bp_path = output_dir / "dbp_backend.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [stack] {bp_path.name}")
    return blueprint


# ─── AGENT 4: BUILD SEQUENCER ───

def sequence_build(frontend_blueprint, rust_blueprint):
    """Compare current state against BUILD-SEQUENCE.md and produce next-phase prompt."""
    output_dir = BLUEPRINTS

    # Parse BUILD-SEQUENCE.md for phase status
    phases_complete = []
    phases_pending = []

    if BUILD_SEQUENCE.exists():
        content = BUILD_SEQUENCE.read_text(encoding='utf-8')
        for match in re.finditer(r'### Phase (\d+):', content):
            phase_num = int(match.group(1))
            phase_section = content[match.start():]
            next_section = re.search(r'### Phase \d+:', phase_section[20:])
            if next_section:
                phase_section = phase_section[:next_section.start()+20]

            if '✅' in phase_section or 'Complete' in phase_section:
                phases_complete.append(phase_num)
            elif '⬜' in phase_section or 'Pending' in phase_section:
                phases_pending.append(phase_num)

    next_phase = min(phases_pending) if phases_pending else None

    # Read CHECKLIST for known bugs and next session
    known_bugs = []
    next_session_info = ''
    checklist_path = PROJECT_ROOT / "docs" / "CHECKLIST.md"
    if checklist_path.exists():
        content = checklist_path.read_text(encoding='utf-8')
        bug_section = re.search(r'## KNOWN BUGS(.*?)(?=##|\Z)', content, re.DOTALL)
        if bug_section:
            for line in bug_section.group(1).strip().split('\n'):
                if line.startswith('|') and 'Description' not in line and '---' not in line:
                    known_bugs.append(line.strip())
        next_section = re.search(r'## NEXT SESSION(.*?)(?=##|\Z)', content, re.DOTALL)
        if next_section:
            next_session_info = next_section.group(1).strip()[:500]

    blueprint = {
        'project': 'Resonance Compass',
        'generated': sacred_timestamp(),
        'phases_complete': sorted(phases_complete),
        'phases_pending': sorted(phases_pending),
        'next_phase': next_phase,
        'total_routes': frontend_blueprint.get('total_routes', 0),
        'known_bugs': known_bugs,
        'next_session': next_session_info,
        'recommendation': f"Execute Phase {next_phase}" if next_phase else "All phases complete"
    }

    bp_path = output_dir / "pbp_resonance_compass.ai.json"
    bp_path.write_text(json.dumps(blueprint, indent=2))
    print(f"  [seq]   {bp_path.name}")
    return blueprint


# ─── UTILITIES ───

def sacred_timestamp():
    return datetime.now().isoformat() + " | in sovereign time"


def detect_phase(route_name: str) -> int:
    """Map route names to their build phases."""
    phase_map = {
        'home': 9,
        'library': 2,
        'library_artist_name': 2,
        'library_album_name': 2,
        'nowplaying': 4,
        'playlists': 3,
        'playlists_id': 3,
        'queue': 4,
        'resonance': 7,
        'search': 11,
        'settings': 10,
        'timer': 8,
        'visualizer': 5,
        'equalizer': 6,
        'sattva': 15,
        'focus': 17,
        'fragments': 17,
        'liked': 10,
        'history': 14,
        'profiles': 16,
        'lyrics': 12,
        'onboarding': 13,
    }
    return phase_map.get(route_name, 99)


def detect_cross_dependencies(stores: dict) -> dict:
    """Detect which stores import other stores."""
    deps = {}
    stores_dir = SRC / "lib" / "stores"
    for store_file in stores_dir.glob("*.ts"):
        content = store_file.read_text(encoding='utf-8')
        store_name = store_file.stem.replace('.svelte', '')
        imports = re.findall(r"from\s+'\$lib/stores/(\w+)'", content)
        if imports:
            deps[store_name] = imports
    return deps


# ─── MAIN ───

def main():
    print("Resonance Compass Blueprint Generator")
    print("=" * 39)
    print()

    BLUEPRINTS.mkdir(parents=True, exist_ok=True)
    (BLUEPRINTS / "layers").mkdir(parents=True, exist_ok=True)

    # Phase 1: Route Scanning
    print("[1] Route Scanning")
    route_blueprints = scan_routes()
    print(f"   OK {len(route_blueprints)} routes scanned")
    print()

    # Phase 2: Layer Integration
    print("[2] Layer Integration")
    store_blueprint = integrate_stores()
    component_blueprint = integrate_components()
    rust_blueprint = integrate_rust_backend()
    types_blueprint = integrate_types()
    styles_blueprint = integrate_styles()
    print("   OK Layers integrated")
    print()

    # Phase 3: Stack Synthesis
    print("[3] Stack Synthesis")
    frontend_bp = synthesize_frontend(route_blueprints, store_blueprint, component_blueprint)
    backend_bp = synthesize_backend(rust_blueprint)
    print("   OK Frontend + backend architecture synthesized")
    print()

    # Phase 4: Build Sequencing
    print("[4] Build Sequencing")
    project_bp = sequence_build(frontend_bp, rust_blueprint)
    print("   OK Build sequence determined")
    print()

    print("=" * 39)
    print(f"Complete. Blueprints in docs/blueprints/")
    print(f"Next phase: {project_bp.get('next_phase', 'Unknown')}")
    if project_bp.get('known_bugs'):
        print(f"Known bugs logged: {len(project_bp['known_bugs'])}")


if __name__ == "__main__":
    main()
