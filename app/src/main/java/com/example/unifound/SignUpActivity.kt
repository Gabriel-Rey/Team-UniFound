package com.example.unifound

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.unifound.databinding.ActivitySignUpBinding

class SignUpActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySignUpBinding
    private lateinit var handler: Handler

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignUpBinding.inflate(layoutInflater)
        setContentView(binding.root)

        handler = Handler(Looper.getMainLooper())
        setupFacultySpinner()
        setupClickListeners()
        setupTextWatchers()
    }

    private fun setupFacultySpinner() {
        // Faculty/Department options
        val faculties = arrayOf(
            "Select Faculty/Department",
            "Faculty of Engineering",
            "Faculty of Science",
            "Faculty of Business",
            "Faculty of Arts",
            "Faculty of Medicine",
            "Faculty of Law",
            "Faculty of Computing",
            "Faculty of Architecture",
            "Other"
        )

        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, faculties)
        binding.actvFaculty.setAdapter(adapter)
        binding.actvFaculty.setText(faculties[0], false)
    }

    private fun setupClickListeners() {
        // Create Account button click
        binding.btnCreateAccount.setOnClickListener {
            performSignUp()
        }

        // Back button click
        binding.btnBack.setOnClickListener {
            finish()
        }

        // Sign in link click (navigate back to login)
        binding.tvSignInHere.setOnClickListener {
            val intent = Intent(this@SignUpActivity, MainActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    private fun performSignUp() {
        // Get input values
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val email = binding.etUniversityEmail.text.toString().trim()
        val studentId = binding.etStudentId.text.toString().trim()
        val faculty = binding.actvFaculty.text.toString().trim()
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()
        val isTermsAccepted = binding.cbTerms.isChecked

        // Clear previous errors
        binding.tilFirstName.error = null
        binding.tilLastName.error = null
        binding.tilUniversityEmail.error = null
        binding.tilStudentId.error = null
        binding.tilUsername.error = null
        binding.tilPassword.error = null
        binding.tilConfirmPassword.error = null
        binding.tilFaculty.error = null

        // Validate inputs
        when {
            firstName.isEmpty() -> {
                binding.tilFirstName.error = "First name is required"
                binding.tilFirstName.requestFocus()
            }
            lastName.isEmpty() -> {
                binding.tilLastName.error = "Last name is required"
                binding.tilLastName.requestFocus()
            }
            email.isEmpty() -> {
                binding.tilUniversityEmail.error = "University email is required"
                binding.tilUniversityEmail.requestFocus()
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                binding.tilUniversityEmail.error = "Please enter a valid email address"
                binding.tilUniversityEmail.requestFocus()
            }
            studentId.isEmpty() -> {
                binding.tilStudentId.error = "Student/Staff ID is required"
                binding.tilStudentId.requestFocus()
            }
            faculty.isEmpty() || faculty == "Select Faculty/Department" -> {
                binding.tilFaculty.error = "Please select your faculty/department"
                binding.tilFaculty.requestFocus()
            }
            username.isEmpty() -> {
                binding.tilUsername.error = "Display name/username is required"
                binding.tilUsername.requestFocus()
            }
            username.length < 3 -> {
                binding.tilUsername.error = "Username must be at least 3 characters"
                binding.tilUsername.requestFocus()
            }
            password.isEmpty() -> {
                binding.tilPassword.error = "Password is required"
                binding.tilPassword.requestFocus()
            }
            password.length < 8 -> {
                binding.tilPassword.error = "Password must be at least 8 characters"
                binding.tilPassword.requestFocus()
            }
            confirmPassword.isEmpty() -> {
                binding.tilConfirmPassword.error = "Please confirm your password"
                binding.tilConfirmPassword.requestFocus()
            }
            password != confirmPassword -> {
                binding.tilConfirmPassword.error = "Passwords do not match"
                binding.tilConfirmPassword.requestFocus()
            }
            !isTermsAccepted -> {
                Toast.makeText(this, "Please accept the Terms & Conditions", Toast.LENGTH_SHORT).show()
            }
            else -> {
                // All validations passed - perform sign up
                registerUser(firstName, lastName, email, studentId, faculty, username, password)
            }
        }
    }

    private fun registerUser(
        firstName: String,
        lastName: String,
        email: String,
        studentId: String,
        faculty: String,
        username: String,
        password: String
    ) {
        // Show loading state
        binding.btnCreateAccount.isEnabled = false
        binding.btnCreateAccount.text = "Creating account..."

        // Simulate network request (Replace with actual API call)
        handler.postDelayed({
            Toast.makeText(
                this,
                "Welcome $firstName $lastName!\nAccount created successfully!",
                Toast.LENGTH_LONG
            ).show()

            // Navigate back to login screen
            val intent = Intent(this@SignUpActivity, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
            finish()

            // Reset button state (though activity is finishing)
            binding.btnCreateAccount.isEnabled = true
            binding.btnCreateAccount.text = "Create Account"
        }, 1500)
    }

    private fun setupTextWatchers() {
        // Clear errors when user focuses on fields
        binding.etFirstName.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilFirstName.error = null
        }

        binding.etLastName.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilLastName.error = null
        }

        binding.etUniversityEmail.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilUniversityEmail.error = null
        }

        binding.etStudentId.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilStudentId.error = null
        }

        binding.actvFaculty.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilFaculty.error = null
        }

        binding.etUsername.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilUsername.error = null
        }

        binding.etPassword.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilPassword.error = null
        }

        binding.etConfirmPassword.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) binding.tilConfirmPassword.error = null
        }

        // Text change listeners to clear errors while typing
        binding.etFirstName.addTextChangedListener(createTextWatcher(binding.tilFirstName))
        binding.etLastName.addTextChangedListener(createTextWatcher(binding.tilLastName))
        binding.etUniversityEmail.addTextChangedListener(createTextWatcher(binding.tilUniversityEmail))
        binding.etStudentId.addTextChangedListener(createTextWatcher(binding.tilStudentId))
        binding.etUsername.addTextChangedListener(createTextWatcher(binding.tilUsername))
        binding.etPassword.addTextChangedListener(createTextWatcher(binding.tilPassword))
        binding.etConfirmPassword.addTextChangedListener(createTextWatcher(binding.tilConfirmPassword))
    }

    private fun createTextWatcher(textInputLayout: com.google.android.material.textfield.TextInputLayout) =
        object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (textInputLayout.error != null && s?.isNotEmpty() == true) {
                    textInputLayout.error = null
                }
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }
}