export namespace Config {
	export function addDefaults<TKeys extends keyof TDef & string, TDef extends UnknownConfigDefinitions>(
		config: Partial<ConfigDefinitionsToConfig<TKeys, TDef>> | undefined,
		definition: TDef,
	): ConfigDefinitionsToConfig<TKeys, TDef> {
		if (!typeIs(config, "table")) {
			config = {};
		}

		for (const [key, def] of pairs(definition)) {
			if (typeIs(config[key], "table") || typeIs(def.config, "table")) {
				if (
					config[key] !== undefined &&
					def.config !== undefined &&
					typeOf(config[key]) !== typeOf(def.config)
				) {
					config[key] = def.config;
				} else if (
					(config[key] === undefined || typeIs(config[key], "table")) &&
					(def.config === undefined || typeIs(def.config, "table"))
				) {
					config[key] = {
						...((def.config as object) ?? {}),
						...(config[key] ?? {}),
					} as (typeof config)[typeof key];
				}

				if (typeIs(config[key], "table") && typeIs(def.config, "table")) {
					for (const [k, v] of pairs(config[key]!)) {
						if (!typeIs(v, "table")) continue;
						if (
							typeIs(def.config, "table") &&
							!typeIs((def.config as never as Record<keyof TDef, unknown>)[k], "table")
						) {
							continue;
						}

						config[key]![k] = {
							...((def.config as object)[k as keyof typeof def.config] as object),
							...(v ?? {}),
						};
					}
				}
			} else {
				config[key] ??= def.config;
			}
		}

		return config as ConfigDefinitionsToConfig<TKeys, TDef>;
	}

	export function removeDeprecated<TKeys extends keyof TDef & string, TDef extends UnknownConfigDefinitions>(
		config: Partial<ConfigDefinitionsToConfig<TKeys, TDef>> | undefined,
		definition: TDef,
	): ConfigDefinitionsToConfig<TKeys, TDef> {
		if (!typeIs(config, "table")) {
			config = {};
		}

		const out: Record<string, unknown> = {};

		for (const [key, def] of pairs(definition)) {
			const k = key as string;
			const value = (config as Record<string, unknown>)[k];
			if (value === undefined) continue;

			if (typeIs(def.config, "table") && typeIs(value, "table")) {
				// def.config here is a plain reference VALUE (e.g. mapUnload's {[name]: bool}
				// or terrain's fields), not a nested definitions map — recurse on shape, not defs.
				out[k] = removeDeprecatedObject(value as Record<string, unknown>, def.config as object);
			} else {
				out[k] = value;
			}
		}

		return out as ConfigDefinitionsToConfig<TKeys, TDef>;
	}

	/**
	 * Recursively strips keys from `value` that don't exist in `reference`.
	 * Both sides are plain data objects (not ConfigDefinitions), so this only
	 * ever compares values to values — never a boolean's `.config`.
	 */
	function removeDeprecatedObject(value: Record<string, unknown>, reference: object): Record<string, unknown> {
		const out: Record<string, unknown> = {};

		for (const [key, refValue] of pairs(reference as Record<string, unknown>)) {
			const k = key as string;
			const v = value[k];
			if (v === undefined) continue;

			if (typeIs(refValue, "table") && typeIs(v, "table")) {
				out[k] = removeDeprecatedObject(v as Record<string, unknown>, refValue as object);
			} else {
				out[k] = v;
			}
		}

		return out;
	}
}
