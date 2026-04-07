package com.example.unifound

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.unifound.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var handler: Handler

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        handler = Handler(Looper.getMainLooper())
        setupClickListeners()
        setupTextWatchers()
    }

    private fun setupClickListeners() {
        // Sign In button click
        binding.btnSignIn.setOnClickListener {
            performLogin()
        }

        // Forgot Password click
        binding.tvForgotPassword.setOnClickListener {
            showForgotPasswordDialog()
        }

        // Sign Up click - FIXED: Navigate to SignUpActivity
        binding.tvSignUp.setOnClickListener {
            val intent = Intent(this@MainActivity, SignUpActivity::class.java)
            startActivity(intent)
        }

        // Support click
        binding.tvSupport.setOnClickListener {
            showSupportDialog()
        }

        // Privacy click
        binding.tvPrivacy.setOnClickListener {
            showPrivacyDialog()
        }

        // Phone click
        binding.tvPhone.setOnClickListener {
            val phoneNumber = "+94716520890"
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
            startActivity(intent)
        }

        // Email footer click
        binding.tvEmailFooter.setOnClickListener {
            val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("mailto:UniFound@gmail.com")
                putExtra(Intent.EXTRA_SUBJECT, "Support Request")
                putExtra(Intent.EXTRA_TEXT, "Hello UniFound Team,\n\n")
            }
            startActivity(Intent.createChooser(emailIntent, "Send email"))
        }

        // Logo click
        binding.ivLogo.setOnClickListener {
            Toast.makeText(this, "UniFound - Lost & Found Portal", Toast.LENGTH_SHORT).show()
        }
    }

    private fun performLogin() {
        // Get input values
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        // Clear previous errors
        binding.tilEmail.error = null
        binding.tilPassword.error = null

        // Validate inputs
        when {
            email.isEmpty() -> {
                binding.tilEmail.error = "Email is required"
                binding.tilEmail.requestFocus()
            }
            email == "your@email.com" -> {
                binding.tilEmail.error = "Please enter your email address"
                binding.tilEmail.requestFocus()
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                binding.tilEmail.error = "Please enter a valid email address"
                binding.tilEmail.requestFocus()
            }
            password.isEmpty() -> {
                binding.tilPassword.error = "Password is required"
                binding.tilPassword.requestFocus()
            }
            password.length < 6 -> {
                binding.tilPassword.error = "Password must be at least 6 characters"
                binding.tilPassword.requestFocus()
            }
            else -> {
                // All validations passed - perform login
                performAuthentication(email, password)
            }
        }
    }

    private fun performAuthentication(email: String, password: String) {
        // Show loading state
        binding.btnSignIn.isEnabled = false
        binding.btnSignIn.text = "Signing in..."

        // Simulate network request (Replace with actual API call)
        handler.postDelayed({
            // OPTION 1: Accept ANY valid input (no credential check)
            Toast.makeText(this, "Welcome back, $email!", Toast.LENGTH_LONG).show()

            // OPTION 2: Check against specific credentials (uncomment if needed)
            // if (email == "demo@unifound.com" && password == "demo123") {
            //     Toast.makeText(this, "Welcome back, $email!", Toast.LENGTH_LONG).show()
            // } else {
            //     Toast.makeText(this, "Invalid credentials. Please try again.", Toast.LENGTH_LONG).show()
            // }

            // TODO: Navigate to Home/Dashboard screen
            // startActivity(Intent(this, HomeActivity::class.java))
            // finish()

            // Reset button state
            binding.btnSignIn.isEnabled = true
            binding.btnSignIn.text = "Sign In"

        }, 1500)
    }

    private fun setupTextWatchers() {
        // Clear email error when user starts typing
        binding.etEmail.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                binding.tilEmail.error = null
            }
        }

        // Clear password error when user starts typing
        binding.etPassword.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                binding.tilPassword.error = null
            }
        }

        // Clear error when text changes
        binding.etEmail.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (binding.tilEmail.error != null && s?.isNotEmpty() == true) {
                    binding.tilEmail.error = null
                }
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })

        binding.etPassword.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (binding.tilPassword.error != null && s?.isNotEmpty() == true) {
                    binding.tilPassword.error = null
                }
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })
    }

    private fun showForgotPasswordDialog() {
        val inputEmail = android.widget.EditText(this).apply {
            hint = "Email Address"
            inputType = android.text.InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        }

        AlertDialog.Builder(this)
            .setTitle("Forgot Password?")
            .setMessage("Enter your email address to receive password reset instructions.")
            .setView(inputEmail)
            .setPositiveButton("Send") { _, _ ->
                val email = inputEmail.text.toString().trim()
                if (email.isNotEmpty() && android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    Toast.makeText(this, "Reset link sent to $email", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showSupportDialog() {
        AlertDialog.Builder(this)
            .setTitle("Support")
            .setMessage("Phone: +94716520890\nEmail: UniFound@gmail.com\n\nOur support team is available 24/7.")
            .setPositiveButton("OK", null)
            .setNeutralButton("Call Now") { _, _ ->
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+94716520890"))
                startActivity(intent)
            }
            .show()
    }

    private fun showPrivacyDialog() {
        AlertDialog.Builder(this)
            .setTitle("Privacy Policy")
            .setMessage("We value your privacy. Your data is encrypted and never shared with third parties.\n\nWe collect only necessary information to help reunite lost items with their owners.")
            .setPositiveButton("OK", null)
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }
}