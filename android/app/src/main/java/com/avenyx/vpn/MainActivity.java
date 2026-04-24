package com.avenyx.vpn;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {
    private EditText emailInput, passwordInput;
    private Button loginBtn, connectBtn;
    private TextView statusText, locationText;
    private ProgressBar loading;

    private OkHttpClient client = new OkHttpClient();
    private String authToken = null;
    private String selectedLocation = "India";

    private static final String API_URL = "https://api.avenyx.qzz.io";
    public static final MediaType JSON = MediaType.parse("application/json");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        loginBtn = findViewById(R.id.loginBtn);
        connectBtn = findViewById(R.id.connectBtn);
        statusText = findViewById(R.id.statusText);
        locationText = findViewById(R.id.locationText);
        loading = findViewById(R.id.loading);

        loginBtn.setOnClickListener(v -> login());
        connectBtn.setOnClickListener(v -> connectVpn());

        checkExistingSession();
    }

    private void checkExistingSession() {
        String storedToken = getSharedPreferences("avenyx", MODE_PRIVATE).getString("token", null);
        if (storedToken != null) {
            authToken = storedToken;
            showDashboard();
        }
    }

    private void login() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show();
            return;
        }

        loading.setVisibility(View.VISIBLE);
        loginBtn.setEnabled(false);

        String json = new Gson().toJson(new LoginRequest(email, password));
        RequestBody body = RequestBody.create(json, JSON);

        Request request = new Request.Builder()
                .url(API_URL + "/auth/login")
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    loading.setVisibility(View.GONE);
                    loginBtn.setEnabled(true);
                    Toast.makeText(MainActivity.this, "Connection failed", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    LoginResponse loginResp = new Gson().fromJson(response.body().string(), LoginResponse.class);
                    authToken = loginResp.token;
                    getSharedPreferences("avenyx", MODE_PRIVATE).edit().putString("token", authToken).apply();
                    
                    runOnUiThread(() -> {
                        loading.setVisibility(View.GONE);
                        showDashboard();
                    });
                } else {
                    runOnUiThread(() -> {
                        loading.setVisibility(View.GONE);
                        loginBtn.setEnabled(true);
                        Toast.makeText(MainActivity.this, "Login failed", Toast.LENGTH_SHORT).show();
                    });
                }
            }
        });
    }

    private void showDashboard() {
        findViewById(R.id.loginLayout).setVisibility(View.GONE);
        findViewById(R.id.dashboardLayout).setVisibility(View.VISIBLE);
        
        fetchConfig();
    }

    private void fetchConfig() {
        if (authToken == null) return;

        Request request = new Request.Builder()
                .url(API_URL + "/vpn/config")
                .addHeader("Authorization", "Bearer " + authToken)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    statusText.setText("Connection failed");
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    runOnUiThread(() -> {
                        locationText.setText("Location: " + selectedLocation);
                        statusText.setText("Ready to connect");
                        connectBtn.setEnabled(true);
                    });
                } else {
                    runOnUiThread(() -> {
                        statusText.setText("No active subscription");
                        connectBtn.setEnabled(false);
                    });
                }
            }
        });
    }

    private void connectVpn() {
        if (authToken == null) {
            Toast.makeText(this, "Please login first", Toast.LENGTH_SHORT).show();
            return;
        }

        loading.setVisibility(View.VISIBLE);
        connectBtn.setEnabled(false);
        statusText.setText("Connecting...");

        Request request = new Request.Builder()
                .url(API_URL + "/vpn/connect")
                .addHeader("Authorization", "Bearer " + authToken)
                .post(RequestBody.create(new byte[0], null))
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    loading.setVisibility(View.GONE);
                    connectBtn.setEnabled(true);
                    statusText.setText("Connection failed");
                    Toast.makeText(MainActivity.this, "Failed to connect", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    runOnUiThread(() -> {
                        loading.setVisibility(View.GONE);
                        connectBtn.setText("Disconnect");
                        connectBtn.setEnabled(true);
                        statusText.setText("Connected");
                    });
                } else {
                    runOnUiThread(() -> {
                        loading.setVisibility(View.GONE);
                        connectBtn.setEnabled(true);
                        statusText.setText("Connection failed");
                        Toast.makeText(MainActivity.this, "Failed to connect", Toast.LENGTH_SHORT).show();
                    });
                }
            }
        });
    }

    static class LoginRequest {
        String email;
        String password;
        LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }
    }

    static class LoginResponse {
        String token;
    }
}