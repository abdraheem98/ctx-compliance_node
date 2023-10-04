/**
 * This function creates a student and will accept details
 * about a person and create an object for them.
 *
 * @param {string} name the student's full name
 * @param {number} age the student's age
 * @param {string} grade the final student's grade
 * @returns {{grade, name, age}} the student object
 */
function createStudent (name, age, grade) {
    return {
        name: name,
        age: age,
        grade: grade
    }
}