package exercise

import (
	"strings"
	"unicode"
)

// MET (metabolic equivalent of task) values drive calorie estimates:
// kcal = MET x body weight (kg) x hours.
//
// The values below are rough defaults chosen to be in the neighbourhood of the
// Compendium of Physical Activities, written from memory and NOT checked
// against it. They are starting points; adjust them, or set a MET on an
// individual exercise, if you want better numbers.
const (
	defaultStrengthMET = 4.0
	defaultCardioMET   = 6.0
)

type metRule struct {
	words []string
	met   float64
}

// Apply to every category.
var generalRules = []metRule{
	{[]string{"stretch", "stretches", "stretching"}, 2.3},
	{[]string{"yoga"}, 2.5},
}

// Apply only to the Cardio category, where words like "row" or "run" mean the
// activity itself. In other categories they are usually a lift ("bent over row")
// or part of another word.
var cardioRules = []metRule{
	{[]string{"sprint", "sprints", "sprinting", "run", "runs", "running"}, 9.8},
	{[]string{"jog", "jogging"}, 7.0},
	{[]string{"skipping", "rope"}, 11.0},
	{[]string{"burpee", "burpees"}, 8.0},
	{[]string{"cycle", "cycling", "bike", "biking", "bicycle"}, 7.5},
	{[]string{"swim", "swimming"}, 6.0},
	{[]string{"row", "rowing"}, 7.0},
	{[]string{"walk", "walking"}, 3.5},
}

// EstimateMET returns a default MET value for an exercise, based on its
// category and the words in its name. Matching is by whole word, so "crunch"
// never matches "run".
func EstimateMET(category, name string) float64 {
	words := tokenize(name)

	if met, ok := firstMatch(generalRules, words); ok {
		return met
	}
	if strings.EqualFold(category, "Cardio") {
		if met, ok := firstMatch(cardioRules, words); ok {
			return met
		}
		return defaultCardioMET
	}
	return defaultStrengthMET
}

func tokenize(s string) map[string]bool {
	fields := strings.FieldsFunc(strings.ToLower(s), func(r rune) bool { return !unicode.IsLetter(r) })
	set := make(map[string]bool, len(fields))
	for _, f := range fields {
		set[f] = true
	}
	return set
}

func firstMatch(rules []metRule, words map[string]bool) (float64, bool) {
	for _, rule := range rules {
		for _, w := range rule.words {
			if words[w] {
				return rule.met, true
			}
		}
	}
	return 0, false
}
